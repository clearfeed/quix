# Kandji Integration

This integration provides tools to manage Apple devices through the Kandji MDM platform. It supports device information retrieval and remote device management actions.

## Implemented Tools

### Device Information Tools

1. **list_kandji_devices**

   - Lists devices managed by Kandji
   - Returns device details including name, model, OS version, serial number, blueprint name, and last enrollment
   - Supports search and pagination parameters

2. **get_kandji_device**
   - Gets detailed information about a specific Kandji device
   - Requires device ID as parameter
   - Returns complete device information including MDM status and agent details

### Device Management Actions

3. **lock_kandji_device**

   - Locks a Kandji-managed device remotely
   - iOS devices require passcode to unlock, macOS devices require generated PIN
   - Requires device to be online and MDM-managed

4. **shutdown_kandji_device**

   - Shuts down a Kandji-managed macOS device (macOS only)
   - Immediately powers off the device if online and connected

5. **restart_kandji_device**

   - Restarts a Kandji-managed macOS device (macOS only)
   - Immediately restarts the device if online and connected

6. **reinstall_kandji_agent**

   - Reinstalls the Kandji agent on a managed device
   - Useful for fixing agent issues or updating to latest version

7. **reset_kandji_device**

   - **WARNING**: Completely erases/resets a Kandji-managed device
   - This action will wipe all data from the device
   - Use with extreme caution

8. **unlock_kandji_user_account**

   - Unlocks the local user account on a Kandji-managed device
   - Useful for resolving locked account issues

9. **send_blank_push_kandji**

   - Sends an update inventory command to trigger device check-in
   - Forces the device to refresh its information with Kandji
   - Helps ensure device status is up to date

10. **set_kandji_device_name**
    - Sets the name of a Kandji-managed device
    - Requires device ID and new device name as parameters

## Configuration

The integration requires the following configuration:

```typescript
interface KandjiConfig {
  apiKey: string; // Your Kandji API key
  baseUrl: string; // Your Kandji instance URL (e.g., https://yourorg.api.kandji.io)
}
```

## Testing Instructions

### Prerequisites

1. Set environment variables:

   ```bash
   export KANDJI_API_KEY="your-api-key-here"
   export KANDJI_BASE_URL="https://yourorg.api.kandji.io"
   ```

2. Ensure you have devices enrolled in your Kandji instance for testing

### Running Tests

```bash
# Install dependencies
yarn install

# Build the package
yarn build

# Run integration tests
yarn test:integration
```

### Test Coverage

The integration tests cover:

- Device listing and retrieval
- Blueprint information
- Device action commands (with proper error handling for non-MDM devices)

**Note**: Device action tests may show expected failures if test devices are not MDM-managed or if specific action endpoints are not available in your Kandji instance.

## Important Notes

### Device Management Requirements

- **MDM Management**: Most device actions require the device to be enrolled and managed by MDM
- **Device Status**: Devices must be online and connected to receive commands
- **Platform Limitations**: Some actions (shutdown, restart) are macOS-only
- **Permissions**: Ensure your API key has appropriate permissions for device actions

### Error Handling

The integration provides comprehensive error handling:

- Network and API errors are caught and returned as structured responses
- MDM status errors are handled gracefully
- Missing endpoints return appropriate error messages

### Rate Limits

Kandji API has the following rate limits:

- 10,000 requests per hour per customer
- 50 requests per second

## Future Considerations

Potential enhancements for future versions:

1. **Bulk Operations**: Support for bulk device actions
2. **Policy Management**: Tools for managing device policies and configurations
3. **App Management**: Installing and removing applications on devices
4. **User Management**: Creating and managing user accounts
5. **Reporting**: Enhanced reporting and analytics capabilities
6. **Webhook Support**: Real-time notifications for device events

## Security Best Practices

- Store API keys securely using environment variables
- Use principle of least privilege for API key permissions
- Regularly rotate API keys
- Monitor API usage for unusual activity
- Test device actions in non-production environment first

## Troubleshooting

### Common Issues

1. **"Device is not managed by MDM"**

   - Ensure the device is properly enrolled in Kandji
   - Check that MDM profiles are installed and active

2. **404 Not Found for device actions**

   - Some endpoints may not be available in all Kandji instances
   - Verify the action is supported for your device type (iOS vs macOS)

3. **Rate limiting errors**

   - Implement proper retry logic with exponential backoff
   - Monitor your request frequency

4. **Authentication errors**
   - Verify your API key is valid and has required permissions
   - Check that your base URL is correct for your Kandji instance
