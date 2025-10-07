# Mirai Server

Developed by: Daniel Gómez

Student from Universidad del Valle de Guatemala in Guatemala City, Guatemala.

This is a graduation work, with aspiration to contribute to the vocational orientation of Guatemala and Latin America.

This is a serverless AWS backend API built with Node.js and MongoDB for the Mirai application. This server provides authentication, content exploration, and interaction tracking functionality.

## Architecture

This server is designed as a serverless architecture with individual Lambda functions for each feature. Each function is self-contained with its own dependencies and can be deployed independently.

## Features

### Authentication

- **User Registration** (`/features/auth/register/`)
  - Creates new user accounts with Clerk integration
  - Validates user data and prevents duplicates
- **User Deletion** (`/features/auth/delete/`)
  - Handles user account removal

### Content Exploration

- **Feed Management** (`/features/explore/feed/`)
  - Retrieves paginated content feed
  - Supports filtering by content types: `career`, `alumni_story`, `what_if`, `short_question`
  - Implements priority-based sorting
- **Card Management**

  - **Create Cards** (`/features/explore/cards/newCard/`)
    - Creates new content cards with metadata
    - Supports multiple content types and tagging
  - **Get Cards** (`/features/explore/cards/getCard/`)
    - Retrieves individual cards by ID

- **Interactions** (`/features/explore/interactions/`)
  - **Track Interactions** (`/features/explore/interactions/newInteraction/`)
    - Records user interactions: `view`, `tap`, `save`, `share`
    - Supports duration tracking and metadata

### Middleware

- **Authentication Middleware** (`/middleware/auth/`)
  - JWT token validation using public key verification
  - Integrates with API Gateway for request authorization

## Technology Stack

- **Runtime**: Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Clerk integration
- **Architecture**: Serverless (AWS Lambda)
- **Environment**: dotenv for configuration

## Environment Variables

Required environment variables:

- `URI`: MongoDB connection string
- `BACKEND_URL`: Base URL for the backend API
- JWT public key (configured in auth middleware)

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `DELETE /auth/delete` - Delete user account

### Content Feed

- `GET /explore/feed` - Get paginated content feed
  - Query parameters:
    - `limit` (default: 7, max: 20)
    - `offset` (default: 0)
    - `types` (comma-separated content types)
    - `user_context` (JSON string for user context)

### Cards

- `POST /explore/cards/newCard` - Create a new content card
- `GET /explore/cards/getCard` - Retrieve a card by ID

### Interactions

- `POST /explore/interactions/newInteraction` - Record user interaction

## Project Structure

```
mirai-server/
├── features/
│   ├── auth/
│   │   ├── register/
│   │   └── delete/
│   ├── explore/
│   │   ├── cards/
│   │   │   ├── newCard/
│   │   │   └── getCard/
│   │   ├── feed/
│   │   └── interactions/
│   │       └── newInteraction/
│   └── courses/ (planned)
└── middleware/
    └── auth/
```

Each feature directory contains:

- `index.js` - Main Lambda handler
- `schema.js` - MongoDB models and validation
- `package.json` - Dependencies
- `node_modules/` - Installed packages

## Data Models

### User Model

- `clerk_id`: Unique identifier from Clerk
- `created_at`: Account creation timestamp

### Card Model

- `type`: Content type (career, alumni_story, what_if, short_question)
- `title`: Card title
- `content`: Card content
- `tags`: Array of tags
- `imageUrl`: Card image URL
- `priority`: Display priority (higher numbers first)
- `color`: Card color theme
- `created_at`: Creation timestamp

### Interaction Model

- `cardId`: Reference to the card
- `action`: Type of interaction (view, tap, save, share)
- `duration`: Interaction duration (optional)
- `metadata`: Additional interaction data (optional)
- `created_at`: Interaction timestamp

## Development

### Prerequisites

- Node.js
- MongoDB instance
- AWS CLI (for deployment)

### Local Development

Each feature is independently deployable. To work on a specific feature:

1. Navigate to the feature directory
2. Install dependencies: `npm install`
3. Set up environment variables
4. Test locally using AWS SAM or similar tools

### Deployment

Each Lambda function should be deployed separately with its dependencies and environment variables configured.

Zip the project into the lambda function.

```
zip -r function.zip .
```

## Contributing

When adding new features:

1. Create a new directory under `features/`
2. Include `index.js`, `schema.js`, and `package.json`
3. Follow the existing patterns for error handling and response formatting
4. Update this README with new endpoints and features

## License

[Add license information here]

---

_This README is a living document. Please update it as the project evolves._
