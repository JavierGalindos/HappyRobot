import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import { Construct } from "constructs";
import * as path from "path";
import { config } from "./config";

export class InfraStack extends cdk.Stack {
  public readonly dataBucket: s3.Bucket;
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- S3 Bucket (loads data + call logs) ---
    this.dataBucket = new s3.Bucket(this, "DataBucket", {
      bucketName: `${config.dataBucketPrefix}-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Upload loads.json to S3
    new s3deploy.BucketDeployment(this, "DeployLoads", {
      sources: [s3deploy.Source.asset(path.join(__dirname, "..", "..", "data"))],
      destinationBucket: this.dataBucket,
      destinationKeyPrefix: "data",
    });

    // --- Lambda Function (container image) ---
    const dockerImage = new ecr_assets.DockerImageAsset(this, "ApiImage", {
      directory: path.join(__dirname, "..", ".."),
      exclude: [
        "infra",
        "dashboard",
        ".venv",
        ".git",
        "node_modules",
        ".idea",
      ],
    });

    const fn = new lambda.DockerImageFunction(this, "ApiFunction", {
      code: lambda.DockerImageCode.fromEcr(dockerImage.repository, {
        tagOrDigest: dockerImage.imageTag,
      }),
      architecture: lambda.Architecture.ARM_64,
      memorySize: config.lambdaMemorySize,
      timeout: cdk.Duration.seconds(config.lambdaTimeout),
      environment: {
        HR_ENVIRONMENT: "production",
        HR_S3_BUCKET: this.dataBucket.bucketName,
        HR_LOADS_S3_KEY: config.loadsS3Key,
        HR_CALL_LOGS_PREFIX: config.callLogsPrefix,
      },
    });

    this.dataBucket.grantReadWrite(fn);

    // --- API Gateway ---
    const api = new apigateway.RestApi(this, "CarrierSalesApi", {
      restApiName: config.apiName,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "x-api-key"],
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(fn);
    api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // API Key + Usage Plan
    const apiKey = api.addApiKey("HappyRobotApiKey");
    const usagePlan = api.addUsagePlan("UsagePlan", {
      name: "HappyRobotPlan",
      throttle: {
        rateLimit: config.throttleRateLimit,
        burstLimit: config.throttleBurstLimit,
      },
    });
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({ stage: api.deploymentStage });

    this.apiUrl = api.url;

    // --- Outputs ---
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway URL",
    });

    new cdk.CfnOutput(this, "ApiKeyId", {
      value: apiKey.keyId,
      description: "API Key ID (use `aws apigateway get-api-key --api-key <id> --include-value` to get the value)",
    });

    new cdk.CfnOutput(this, "DataBucketName", {
      value: this.dataBucket.bucketName,
      description: "S3 data bucket name",
    });
  }
}
