import RequestPromise from "request-promise";

type FacebookUser = {
    name: string;
    email: string;
};

export class FacebookApiService {
    public async getUserInfo(accessToken: string): Promise<FacebookUser | undefined> {
        try {
            const res = await RequestPromise(
                "https://graph.facebook.com/v5.0/me",
                {
                    qs: {
                        fields: "name,email",
                        access_token: accessToken,
                    },
                },
            );
            const data = JSON.parse(res);

            return {
                email: data.email,
                name: data.name,
            };
        } catch (_) {
            return undefined;
        }
    }
}
