export type RequestHandler = {
  handle: (request: Request) => Promise<Response>;
};
