export class NextResponse {
  constructor(body, init = {}) {
    this.status = init?.status ?? 200;
    this.headers = init?.headers ?? {};
    this.body = body;
  }

  static json(body, init = {}) {
    return new NextResponse(body, init);
  }

  async json() {
    return this.body;
  }
}
