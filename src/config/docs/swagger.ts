import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { SWAGGER_CONFIG } from './swagger.config';
import { ALL_SWAGGER_TAGS } from '../modules-description.swagger';

export function configureSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const swaggerTitle: string =
    configService.get<string>('SWAGGER_TITLE') ?? SWAGGER_CONFIG.title;
  const swaggerDescription: string =
    configService.get<string>('SWAGGER_DESCRIPTION') ??
    SWAGGER_CONFIG.description;
  const swaggerVersion: string =
    configService.get<string>('SWAGGER_VERSION') ?? SWAGGER_CONFIG.version;

  const options = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion(swaggerVersion)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Introduce tu token JWT en el header Authorization',
      },
      'JWT-auth',
    );

  // Registrar todos los tags definidos en ALL_SWAGGER_TAGS
  ALL_SWAGGER_TAGS.forEach((tag) => options.addTag(tag.name, tag.description));

  const serversEnv: string = configService.get<string>('SWAGGER_SERVERS') ?? '';
  if (serversEnv) {
    const servers = serversEnv.split(',').filter((url) => url.trim() !== '');
    servers.forEach((url, index) =>
      options.addServer(url, `Server ${index + 1}`),
    );
  }

  const document = SwaggerModule.createDocument(app, options.build(), {
    deepScanRoutes: true,
  });

  let scalarRoute: string =
    configService.get<string>('SWAGGER_ROUTE') ?? '/docs';

  if (!scalarRoute.startsWith('/')) {
    scalarRoute = `/${scalarRoute}`;
  }

  app.use(
    scalarRoute,
    apiReference({
      theme: 'bluePlanet',
      darkMode: true,
      layout: 'modern',
      spec: {
        content: document,
      },
    }),
  );
}
