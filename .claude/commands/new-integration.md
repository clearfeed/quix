# Creating a New Integration

You are an experienced software engineer and architect tasked with building a new integration in this repository. These integrations are designed for tool calling with an LLM. Follow this workflow strictly to ensure the integration is well-architected and easy to maintain.

## Step 1: Gather Information

Before starting implementation, ask the developer for the following required information:

- **Integration Name**: Use this to create a new directory in `agent-packages/packages/`.
- **API Documentation URL**: Use this to identify API endpoints and methods.
- **API Key**: Use this for authentication and testing with curl commands.
- **Features to Implement**: Use this to determine which API endpoints and methods to support. **DO NOT** implement any features not explicitly requested by the developer.

## Step 2: Implement the Integration

Use the gathered information to build the integration.

### Review Existing Integrations

Examine similar integrations in the `agent-packages/packages/` directory based on the type of system:

- For CRMs, reference HubSpot or Salesforce.
- For asset management, reference AssetPanda.
- If no similar integration exists, use any recent integration as a reference.

Adopt their architecture, file structure, naming conventions, documentation style, and testing approach.

### Create the Integration Package

Follow these rules when creating the integration:

- If available, use the system's SDK from the npm registry.
- Always use Yarn for package management; never use npm.
- Isolate each simple functionality into separate tools. Consider how an LLM would invoke them based on user requests.
- Define new types only if the system's SDK lacks them.
- Avoid using the `any` type.
- Avoid type casting.
- Ensure the integration requires no complex logic. If complex logic seems necessary, reconsider your approach and ask the developer for clarification.
- **IMPORTANT**: Always follow the BaseResponse pattern:
  - Import `BaseResponse` and `BaseService` from `@clearfeed-ai/quix-common-agent`
  - Make your service class implement `BaseService<YourConfig>`
  - Make your config interface extend `BaseConfig`
  - Return `BaseResponse<T>` from all service methods
  - In tools, unwrap the BaseResponse and throw errors if the operation failed
  - Add proper error handling with try/catch blocks in service methods
- To select tools to implement:
  1. Use the provided \"Features to Implement\".
  2. Consider real-world scenarios for LLM usage.
  3. Propose a list of tools and confirm with the developer before implementing.
- For each tool:
  1. Test the API input and output using curl commands with the provided API key.
  2. Implement the tool only if the API behaves as expected.
  3. If issues arise, reconsider and ask the developer for clarification.

#### Tool Implementation Example

**Scenario**: User wants to add a note to a HubSpot deal but knows only the deal name, not the dealId.

❌ **Incorrect Approach**:
Implement a single tool that searches for deals by keyword, selects the closest match, and adds the note using that dealId.

✅ **Correct Approach**:

- Create a tool to search for deals by keyword.
- Create a separate tool to add a note to a deal, requiring dealId and note content as inputs.
  The LLM will handle chaining: first search for the deal, then use the retrieved dealId to add the note.

## Step 3: Test the Integration

- Test using the developer's provided API keys.
- **DO NOT** hard-code API keys; use environment variables instead.
- **DO NOT** use mocks in the integration code; test with real API calls.

## Type Pattern Guidelines

- **Use Zod schema inferred types**: Define parameter types using `z.infer<typeof SCHEMAS.schemaName>` or `z.input<typeof SCHEMAS.schemaName>` for schemas with defaults/optional fields
- **Avoid duplicate type definitions**: Don't define separate interfaces that duplicate Zod schema structure
- **Service method signatures**: Use named parameter types like `params: GetEmployeeParams` instead of inline object types
- **Export inferred types**: Add type exports in `types.ts` like `export type GetEmployeeParams = z.infer<typeof SCHEMAS.getEmployeeSchema>;`
- **Tools consistency**: Use the named types in tools instead of inline `z.infer` calls
- **Zod Schema Best Practices**: For better null handling, use `.nullish().transform((val) => val ?? undefined)` instead of `.optional()` for optional fields. Do not combine `.nullish()` with `.default()`:

  ```ts
  // Preferred: Handles both null and undefined properly
  const schema = z.object({
    name: z
      .string()
      .nullish()
      .transform((val) => val ?? undefined),
    email: z
      .string()
      .email()
      .nullish()
      .transform((val) => val ?? undefined),
    age: z.number().default(0) // For fields with defaults - don't use .nullish() here
  });

  // Avoid: Only handles undefined, not null values
  const schema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    age: z.number().nullish().default(0) // Don't combine .nullish() with .default()
  });
  ```

## Step 4: Document the Integration

- Create a `README.md` file in the integration directory.
- Include the following sections:
  - Integration Name
  - Implemented Tools (list and describe each)
  - Testing Instructions
  - Future Considerations"
