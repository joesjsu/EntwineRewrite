import PushNotifications from 'node-pushnotifications';
import { logger } from '@/config/logger';
import { db } from '@/db'; // Assuming db instance is exported from here
import { userDeviceTokens, platformEnum } from '@entwine-rewrite/shared';
import { eq, and } from 'drizzle-orm';


// TODO: Load these securely from environment variables or a config service
const settings: PushNotifications.Settings = {
    gcm: {
        id: process.env.FCM_SERVER_KEY, // FCM Server Key
        // options: {
        //     timeout: 3000, // Default is 5000 (5 seconds)
        // },
    },
    apn: {
        token: {
            key: process.env.APNS_KEY_PATH, // Path to the key p8 file
            keyId: process.env.APNS_KEY_ID, // The Key ID of the p8 file (available at https://developer.apple.com/account/ios/certificate/key)
            teamId: process.env.APNS_TEAM_ID, // The Team ID of your Apple Developer Account (available at https://developer.apple.com/account/#/membership/)
        },
        production: process.env.NODE_ENV === 'production', // Set true for production environment
        // connectionRetryLimit: 5, // Default is 3
        // cacheLength: 1000, // Default is 100
        // connectionTimeout: 10000, // Default is 10000 (10 seconds)
        // autoAdjustCache: true, // Default is true
        // maxConnections: 5, // Default is 1
        // minConnections: 1, // Default is 1
        // connectTimeout: 10000, // Default is 10000 (10 seconds)
        // buffersNotifications: true, // Default is true
        // fastMode: false, // Default is false
        // disableNagle: false, // Default is false
        // disableEPIPEFix: false, // Default is false
    },
    // adm: { // Amazon Device Messaging
    //     client_id: process.env.ADM_CLIENT_ID,
    //     client_secret: process.env.ADM_CLIENT_SECRET,
    // },
    // web: { // Web Push Notifications
    //     vapidDetails: {
    //         subject: 'mailto:myemail@mydomain.com', // VAPID subject
    //         publicKey: process.env.VAPID_PUBLIC_KEY,
    //         privateKey: process.env.VAPID_PRIVATE_KEY,
    //     },
    //     gcmAPIKey: process.env.FCM_SERVER_KEY, // GCM API Key
    //     TTL: 2419200, // Time to live in seconds
    //     contentEncoding: 'aes128gcm', // Default is 'aesgcm'
    //     headers: {}, // Optional headers
    //     proxy: undefined, // Optional proxy URL
    // },
    isAlwaysUseFCM: false, // true all messages will be sent through node-gcm (which actually uses FCM)
};

interface PushPayload {
    title: string;
    body: string;
    custom?: Record<string, any>; // For additional data
    // Add other platform-specific options if needed
    badge?: number; // iOS badge count
    sound?: string; // iOS/Android sound
    // ... other options from node-pushnotifications documentation
}

export class PushService {
    private push: PushNotifications;

    constructor() {
        this.push = new PushNotifications(settings);
    }

    /**
     * Sends a push notification to the specified device tokens.
     *
     * @param deviceTokens An array of device registration tokens (string).
     * @param payload The notification content (title, body, custom data).
     */
    async sendNotification(deviceTokens: string[], payload: PushPayload): Promise<void> {
        if (!deviceTokens || deviceTokens.length === 0) {
            logger.warn('[PushService] No device tokens provided, skipping notification.');
            return;
        }

        // Ensure tokens are unique
        const uniqueTokens = [...new Set(deviceTokens)];

        const data: PushNotifications.Data = {
            title: payload.title,
            body: payload.body,
            custom: payload.custom || {},
            priority: 'high', // Default priority
            retries: 1, // Default retries
            // Add platform-specific fields from payload if needed
            badge: payload.badge,
            sound: payload.sound || 'default', // Default sound
            // ... other fields
        };

        try {
            const results = await this.push.send(uniqueTokens, data);
            logger.info(`[PushService] Attempted to send notification to ${uniqueTokens.length} devices.`);

            // Log success/failure details
            results.forEach((result) => {
                if (result.success) {
                    // logger.debug(`[PushService] Successfully sent to token: ${result.message?.[0]?.regId}`); // Be careful logging tokens
                } else if (result.failure > 0) {
                    logger.error(`[PushService] Failed to send ${result.failure} notifications. Error: ${result.message?.[0]?.errorMsg}`);
                    // TODO: Handle specific errors (e.g., invalid tokens, rate limits)
                    // Consider removing invalid tokens from the database
                }
            });
        } catch (error) {
            logger.error('[PushService] Error sending push notification:', error);
            // Handle broader errors (e.g., configuration issues, network problems)
        }
    }


    /**
     * Registers a device token for a user.
     * If the token already exists for the user, it updates the timestamp.
     *
     * @param userId The ID of the user.
     * @param token The device token string.
     * @param platform The platform ('ios', 'android', 'web').
     */
    async registerDeviceToken(userId: number, token: string, platform: typeof platformEnum.enumValues[number]): Promise<void> {
        logger.info(`[PushService] Registering token for user ${userId}, platform ${platform}`);
        try {
            await db.insert(userDeviceTokens)
                .values({
                    userId,
                    token,
                    platform,
                    updatedAt: new Date(), // Explicitly set updatedAt on insert/update
                })
                .onConflictDoUpdate({
                    target: [userDeviceTokens.userId, userDeviceTokens.token],
                    set: { updatedAt: new Date() },
                });
            logger.debug(`[PushService] Successfully registered token for user ${userId}`);
        } catch (error) {
            logger.error(`[PushService] Error registering device token for user ${userId}:`, error);
            // Re-throw or handle as needed
            throw error;
        }
    }

    /**
     * Unregisters a specific device token for a user.
     *
     * @param userId The ID of the user.
     * @param token The device token string to remove.
     */
    async unregisterDeviceToken(userId: number, token: string): Promise<void> {
        logger.info(`[PushService] Unregistering token for user ${userId}`);
        try {
            // Use .returning() to check if any rows were actually deleted
            const deletedRows = await db.delete(userDeviceTokens)
                .where(and(
                    eq(userDeviceTokens.userId, userId),
                    eq(userDeviceTokens.token, token)
                ))
                .returning({ id: userDeviceTokens.id }); // Return the ID of deleted rows

            if (deletedRows.length > 0) {
                logger.debug(`[PushService] Successfully unregistered token for user ${userId}`);
            } else {
                logger.warn(`[PushService] Token not found for unregistration for user ${userId}`);
            }
        } catch (error) {
            logger.error(`[PushService] Error unregistering device token for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Retrieves all device tokens for a given user.
     *
     * @param userId The ID of the user.
     * @returns An array of device token strings.
     */
    async getDeviceTokensForUser(userId: number): Promise<string[]> {
        logger.debug(`[PushService] Fetching tokens for user ${userId}`);
        try {
            const results = await db.select({ token: userDeviceTokens.token })
                .from(userDeviceTokens)
                .where(eq(userDeviceTokens.userId, userId));

            const tokens = results.map(r => r.token);
            logger.debug(`[PushService] Found ${tokens.length} tokens for user ${userId}`);
            return tokens;
        } catch (error) {
            logger.error(`[PushService] Error fetching device tokens for user ${userId}:`, error);
            return []; // Return empty array on error
        }
    }

    // TODO: Add methods for managing device tokens (register, unregister) if needed
    // These would likely interact with the database (e.g., a user_devices table)
}


// Export a singleton instance for easy use across the application
export const pushService = new PushService();
// Optional: Export a singleton instance if preferred
// export const pushService = new PushService();