import jwt from "jsonwebtoken";

const publicKey = process.env.PUBLIC_KEY.replace(/\\n/g, "\n");

export async function handler(event, context, callback) {
  try {
    // Extract the token from the Authorization header
    const token = event.authorizationToken.split(" ")[1];

    // Verifies and decodes the JWT
    const claims = jwt.verify(token, publicKey);

    const decode = jwt.decode(token);

    console.log("decode:", decode);
    console.log("claims:", claims);

    // Attach the user id from Clerk into the metadata
    // We'll ensure metadata exists and add user_id to it
    const metadata = {
      ...(claims.metadata || {}),
      user_id: claims.sub,
    };

    // If the token is valid, the user is authorized
    callback(
      null,
      generatePolicy(metadata, claims.sub, "Allow", event.methodArn)
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
