#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { InfraStack } from "../lib/infra-stack";
import { DashboardStack } from "../lib/dashboard-stack";
import { config } from "../lib/config";

const app = new cdk.App();
const env = { account: config.account, region: config.region };

new InfraStack(app, config.stackName, { env });
new DashboardStack(app, config.dashboardStackName, { env });
