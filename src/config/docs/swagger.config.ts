import { SwaggerConfig } from './swagger.interface';
/* This code snippet is defining a constant `SWAGGER_CONFIG` of type `SwaggerConfig`. It is an object
that contains properties such as `title`, `description`, `version`, `tags`, `route`, and `servers`. */
export const SWAGGER_CONFIG: SwaggerConfig = {
  title: process.env.SWAGGER_TITLE || '',
  description: process.env.SWAGGER_DESCRIPTION || '',
  version: process.env.SWAGGER_VERSION || '',
  tags: [],
  route: process.env.SWAGGER_ROUTE || '',
  servers: [process.env.SWAGGER_SERVER || ''],
};
