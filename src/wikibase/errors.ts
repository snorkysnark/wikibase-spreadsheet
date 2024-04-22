export class ResponseError extends Error {
  response: Response;

  constructor(response: Response) {
    super(`Bad response: ${response.status}`);
    this.response = response;
  }

  static raiseForStatus(response: Response) {
    if (!response.ok) throw new ResponseError(response);
  }
}

export interface ErrorData {
  error: {
    code: string;
    info: string;
    messages?: {
      name: string;
      parameters: string[];
      html: { ["*"]: string };
    }[];
  };
}

export class WikibaseError extends Error {
  data: ErrorData;

  constructor(data: ErrorData) {
    super(data.error.info || data.error.code || "Unknown error");
    this.data = data;
  }

  public get messages(): string[] {
    return [
      ...(this.data.error.messages?.map((message) => message.html["*"]) || []),
    ];
  }

  static raiseForErrors(data: any) {
    if ("error" in data) throw new WikibaseError(data);
  }
}

export async function handleErrors(promise: Promise<Response>): Promise<any> {
  return promise
    .then((response) => {
      ResponseError.raiseForStatus(response);
      return response.json();
    })
    .then((json) => {
      WikibaseError.raiseForErrors(json);
      return json;
    });
}
