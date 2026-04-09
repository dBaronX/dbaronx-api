async getAccessToken() {
  const email = this.configService.get<string>('CJ_EMAIL');
  const password = this.configService.get<string>('CJ_PASSWORD');

  if (!email || !password) {
    throw new Error('CJ credentials missing');
  }

  const response = await fetch(
    'https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(`CJ token error: ${JSON.stringify(data)}`);
  }

  return data.data.accessToken;