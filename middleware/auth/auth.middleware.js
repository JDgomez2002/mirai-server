import jwt from "jsonwebtoken";

const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1vwd9UkPUK/xQDYe/+wP
oNQ7t6rIbuOiNQGBpFeLKTNEvR4uE5wAWy+IYuXBrjIEYya/o0zQBAYsH92G+hNB
1U56JVKxaSLmWldpxlUTgFlVGgsMbCkbnB9FOgHyHeN9I+GfoqB4MQxiBRCBrzXx
yH0U3cGFlBLHrSo3cwUt6Aq9s8F7J7aIVwqYcQ5yGpRy+NQVLbecFA/Uix6v6DMl
wMrVIy1mCQnmVdu1qU8d7ZiUzQxaOhlMDug5fkJHYkwgbjzNXj951N4hhxTtwkCv
hjyTO2xYAbsf4IzqoV62x5QUhsLTopl/VB2K8Z+OJq1t3dpI+R1UDXJbMWW83QqX
SwIDAQAB
-----END PUBLIC KEY-----
`;

export async function handler(event, context, callback) {
  try {
    // Extract the token from the Authorization header
    const token = event.authorizationToken.split(" ")[1];

    // Verifies and decodes the JWT
    const claims = jwt.verify(token, publicKey);

    // If the token is valid, the user is authorized
    callback(
      null,
      generatePolicy(claims.metadata, claims.sub, "Allow", event.methodArn)
    );
  } catch (err) {
    // If verification fails, deny access
    callback(null, generatePolicy(null, "unknown", "Deny", event.methodArn));
  }
}

function generatePolicy(metadata, principalId, effect, resource) {
  const authResponse = {
    principalId: principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
  if (metadata) {
    authResponse.context = metadata;
  }
  return authResponse;
}
