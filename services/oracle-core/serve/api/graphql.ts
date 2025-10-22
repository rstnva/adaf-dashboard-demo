export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
}

export interface GraphQLResponse {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string }>;
}

export async function executeGraphQL(_request: GraphQLRequest): Promise<GraphQLResponse> {
  return {
    errors: [
      {
        message: 'GraphQL endpoint is disabled in mock mode',
      },
    ],
  };
}
