import {
  Stack,
  StackProps,
  aws_s3,
  aws_apigateway,
  aws_lambda,
  Duration,
  aws_dynamodb,
  aws_s3_notifications,
  aws_lambda_event_sources,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsCdkCymotiveStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new aws_s3.Bucket(this, 'someBucket', {
      bucketName: 'reports34567890844',
    });

    const porter = new aws_lambda.Function(this, 'porter2', {
      runtime: aws_lambda.Runtime.NODEJS_14_X,
      code: aws_lambda.Code.fromAsset('functions'),
      handler: 'porter.handler',
      functionName: 'porter2',
      timeout: Duration.seconds(8),
    });

    bucket.grantWrite(porter);

    const api = new aws_apigateway.RestApi(this, 'cymotive-reports', {
      restApiName: 'cymotive-reports',
      endpointTypes: [aws_apigateway.EndpointType.REGIONAL],
    });

    const writeReportsIntegration = new aws_apigateway.LambdaIntegration(
      porter,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    api.root.addMethod('POST', writeReportsIntegration);

    const table = new aws_dynamodb.Table(this, 'ids-table2', {
      tableName: 'ids-table2',
      partitionKey: {
        name: 'vehicleId',
        type: aws_dynamodb.AttributeType.STRING,
      },
    });

    const ingest = new aws_lambda.Function(this, 'ingest2', {
      runtime: aws_lambda.Runtime.NODEJS_14_X,
      code: aws_lambda.Code.fromAsset('functions'),
      handler: 'ingest.handler',
      functionName: 'ingest2',
      timeout: Duration.seconds(8),
    });
    bucket.grantRead(ingest);
    table.grantWriteData(ingest);

    const s3PutEventSource = new aws_lambda_event_sources.S3EventSource(
      bucket,
      {
        events: [aws_s3.EventType.OBJECT_CREATED_PUT],
      }
    );
    ingest.addEventSource(s3PutEventSource);

    const analyzer = new aws_lambda.Function(this, 'analyzer2', {
      runtime: aws_lambda.Runtime.NODEJS_14_X,
      code: aws_lambda.Code.fromAsset('functions'),
      handler: 'analyzer.handler',
      functionName: 'analyzer2',
      timeout: Duration.seconds(8),
    });

    // table.grantReadData(analyzer);
    table.grantFullAccess(analyzer);

    const countInfo = new aws_apigateway.LambdaIntegration(analyzer, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    api.root.addMethod('GET', countInfo);

    // example resource
    // const queue = new sqs.Queue(this, 'AwsCdkCymotiveQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
