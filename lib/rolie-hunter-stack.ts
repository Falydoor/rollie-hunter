import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";

export class RolieHunterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function
    const hunterFunc = new lambda.Function(this, 'hunter-lambda', {
      functionName: 'roliehunter-grabber',
      code: new lambda.AssetCode('./hunter'),
      handler: 'app.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: cdk.Duration.seconds(300),
      memorySize: 1024
    });

    // DynamoDB table
    const table = new dynamodb.Table(this, `${id}-table`, {
      tableName: "roliehunter-watches",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    table.grantReadWriteData(hunterFunc)

    hunterFunc.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'SES:SendRawEmail'],
      resources: ['*'],
      effect: iam.Effect.ALLOW,
    }));
  }
}
