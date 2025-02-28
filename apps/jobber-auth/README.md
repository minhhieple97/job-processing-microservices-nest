# Jobber Auth Service

This service provides authentication and user management functionality for the Jobber application.

## GraphQL API

The service exposes a GraphQL API with the following operations:

### User Operations

#### Create User (Registration)

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    email
    createdAt
    updatedAt
  }
}

# Variables
{
  "input": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

#### Get Current User

```graphql
query Me {
  me {
    id
    email
    createdAt
    updatedAt
  }
}
```

### Authentication Operations

#### Login

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    user {
      id
      email
    }
    accessToken
    refreshToken
  }
}

# Variables
{
  "input": {
    "email": "user@example.com",
    "password": "password123"
  }
}
```

#### Refresh Token

```graphql
mutation RefreshToken($input: RefreshTokenInput) {
  refreshToken(input: $input) {
    accessToken
  }
}

# Variables (optional if using cookies)
{
  "input": {
    "refreshToken": "your-refresh-token"
  }
}
```

#### Logout

```graphql
mutation Logout {
  logout {
    success
    message
  }
}
```

## Authentication Flow

1. **Registration**: Use the `createUser` mutation to register a new user.
2. **Login**: Use the `login` mutation to authenticate and receive access and refresh tokens.
3. **Authenticated Requests**: Include the access token in the Authorization header as a Bearer token:
   ```
   Authorization: Bearer your-access-token
   ```
4. **Token Refresh**: When the access token expires, use the `refreshToken` mutation to get a new access token.
5. **Logout**: Use the `logout` mutation to invalidate the current session.

## Token Handling

The service supports two methods for token handling:

1. **HTTP-only Cookies**: Tokens are automatically stored in secure HTTP-only cookies.
2. **Manual Token Management**: Tokens are returned in the response and must be managed by the client.

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- HTTP-only cookies for secure token storage
- Token refresh mechanism
- Protected routes with Guards
