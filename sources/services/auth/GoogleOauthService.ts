import { Credentials, OAuth2Client } from "google-auth-library";
import { google, oauth2_v2 } from "googleapis";

type ServiceCredentials = {
    readonly clientId: string;
    readonly clientSecret: string;
    readonly redirectUri: string;
    readonly scopes: string;
};

export class GoogleOauthService {
    private readonly oauth: OAuth2Client;

    constructor(
        private readonly credentials: ServiceCredentials,
    ) {
        this.oauth = new google.auth.OAuth2(
            credentials.clientId,
            credentials.clientSecret,
            credentials.redirectUri,
        );
    }

    public generateAuthUrl(): string {
        return this.oauth.generateAuthUrl({
            access_type: "offline", // "offline" to obtain a refresh_token
            scope: this.credentials.scopes,
        });
    }

    public async getCredentialsFromCode(code: string): Promise<Credentials> {
        const response = await this.oauth.getToken(code);
        return response.tokens;
    }

    public async getUserInfo(accessToken: string, refreshToken: string): Promise<oauth2_v2.Schema$Userinfoplus> {
        const client = this.createOauthApiClient(accessToken, refreshToken);

        const res = await client.userinfo.get();
        return res.data;
    }

    private createOauthApiClient(accessToken: string, refreshToken: string): oauth2_v2.Oauth2 {
        this.oauth.setCredentials({
            refresh_token: refreshToken,
            access_token: accessToken,
        });
        return google.oauth2({
            auth: this.oauth,
            version: "v2",
        });
    }
}
