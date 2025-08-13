import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import serverless from 'serverless-http';
import app from './serverless';

// Create serverless handler for AWS Lambda
const handler = serverless(app, {
  binary: false,
  request: (request: any, event: APIGatewayProxyEvent, context: Context) => {
    // Add Lambda-specific request modifications here if needed
    request.serverless = {
      event,
      context,
      provider: 'aws-lambda'
    };
  },
  response: (response: any, event: APIGatewayProxyEvent, context: Context) => {
    // Add Lambda-specific response modifications here if needed
    response.headers = {
      ...response.headers,
      'X-Serverless-Provider': 'aws-lambda',
      'X-Request-ID': context.awsRequestId
    };
  }
});

export { handler };

// Alternative export for compatibility
export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    return await handler(event, context);
  } catch (error) {
    console.error('Lambda handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId
      })
    };
  }
};