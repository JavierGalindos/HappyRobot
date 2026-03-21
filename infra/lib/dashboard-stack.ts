import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";
import { config } from "./config";

export class DashboardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- S3 Bucket for React Dashboard ---
    const dashboardBucket = new s3.Bucket(this, "DashboardBucket", {
      bucketName: `${config.dashboardBucketPrefix}-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // --- CloudFront for Dashboard ---
    const oai = new cloudfront.OriginAccessIdentity(this, "DashboardOAI");
    dashboardBucket.grantRead(oai);

    const distribution = new cloudfront.Distribution(this, "DashboardCDN", {
      defaultBehavior: {
        origin: new origins.S3Origin(dashboardBucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
    });

    // --- Outputs ---
    new cdk.CfnOutput(this, "DashboardUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "Dashboard CloudFront URL",
    });

    new cdk.CfnOutput(this, "DashboardBucketName", {
      value: dashboardBucket.bucketName,
      description: "Dashboard S3 bucket name",
    });
  }
}
