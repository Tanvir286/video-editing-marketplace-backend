import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// User Types Define (Enum map)
export const USER_TYPES = {
  ADMIN: 'admin-token',
  CLIENT: 'client-token',
  EDITOR: 'editor-token',
} as const;

export function setupSwagger(app: INestApplication) {
  const builder = new DocumentBuilder()
    .setTitle(`${process.env.APP_NAME} api`)
    .setDescription(`${process.env.APP_NAME} api docs`)
    .setVersion('1.0')
    .addTag(`${process.env.APP_NAME || 'API'}`);

  // 3ti role-er jonne alada alada Bearer Auth add kora hocche
  Object.values(USER_TYPES).forEach((name) => {
    builder.addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        description: `Enter JWT token for ${name.replace('-token', '').toUpperCase()} role`,
      },
      name,
    );
  });

  const options = builder.build();
  const document = SwaggerModule.createDocument(app, options);

  // Swagger UI Configuration with Auto-Login Interceptor
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      
      // Response Interceptor for Auto-Auth
      responseInterceptor: function (response: any) {
        try {
          // Apnar auth login api endpoint jodi alada hoy, tahole '/auth/login' ta change korte paren
          if (response.url && response.url.indexOf('/auth/login') !== -1) {
            if (response.status === 200 || response.status === 201) {
              let data = response.obj || response.body || response.data;
              if (typeof data === 'string') {
                data = JSON.parse(data);
              }

              console.log('[Swagger] Login response received');

              // Response internal structure onusare token/role ber kora
              // Apnar login response design (e.g. data.token ba data.authorization.access_token) hile eta check korun
              const token = data?.token || data?.data?.token || data?.authorization?.access_token || data?.data?.authorization?.access_token;
              
              let roleName = data?.role || data?.data?.role || data?.role_name || data?.data?.role_name;

              if (!token) {
                console.warn('[Swagger] No token found in response.');
                return response;
              }

              if (roleName) {
                roleName = roleName.toString().toUpperCase();
              } else {
                roleName = 'CLIENT'; // Default fallback role
              }

              console.log('[Swagger] Role detected:', roleName);

              // Role onujayi authKey mapping
              const roleMap: Record<string, string> = {
                ADMIN: 'admin-token',
                CLIENT: 'client-token',
                EDITOR: 'editor-token',
              };

              const authKey = roleMap[roleName] || 'client-token';
              const ui = (window as any).ui;

              if (ui && ui.authActions) {
                const authorization: Record<string, any> = {};
                authorization[authKey] = {
                  name: authKey,
                  schema: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
                  value: token,
                };

                // Swagger UI matrix state authorize kora
                ui.authActions.authorize(authorization);
                console.log('[Swagger] Authorized successfully with key:', authKey);

                // LocalStorage persistence
                try {
                  const currentAuth = localStorage.getItem('authorized');
                  const parsedAuth = currentAuth ? JSON.parse(currentAuth) : {};
                  parsedAuth[authKey] = authorization[authKey];
                  localStorage.setItem('authorized', JSON.stringify(parsedAuth));
                } catch (e) {
                  console.warn('[Swagger] LocalStorage save failed:', e);
                }
              }
            }
          }
        } catch (err) {
          console.error('[Swagger] Auto-auth error:', err);
        }
        return response;
      },
    },
  });
}