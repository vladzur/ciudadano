import { HttpException, HttpStatus } from "@nestjs/common";
import { HttpExceptionFilter } from "./http-exception.filter.js";

describe("HttpExceptionFilter", () => {
  let filter: HttpExceptionFilter;

  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });

  function createHost(status?: number, message?: string) {
    const exception = status
      ? new HttpException(message ?? "Error message", status)
      : new Error("Unknown error");

    return {
      switchToHttp: () => ({
        getResponse: () => ({
          status: mockStatus,
        }),
      }),
      getArgByIndex: () => exception,
    };
  }

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    jest.clearAllMocks();
  });

  it("should format HttpException with proper status and message", () => {
    const host = createHost(HttpStatus.BAD_REQUEST, "Datos inválidos");

    filter.catch(new HttpException("Datos inválidos", HttpStatus.BAD_REQUEST), host as any);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Datos inválidos",
      statusCode: 400,
    });
  });

  it("should format NotFoundException", () => {
    const host = createHost(HttpStatus.NOT_FOUND, "Denuncia no encontrada.");

    filter.catch(new HttpException("Denuncia no encontrada.", HttpStatus.NOT_FOUND), host as any);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Denuncia no encontrada.",
      statusCode: 404,
    });
  });

  it("should return 500 for non-Http exceptions", () => {
    const host = createHost();
    const error = new Error("Unexpected error");

    filter.catch(error, host as any);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Error interno del servidor",
      statusCode: 500,
    });
  });

  it("should return 500 for unknown exception types", () => {
    const host = createHost();

    filter.catch("raw string error", host as any);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: "Error interno del servidor",
      statusCode: 500,
    });
  });
});
