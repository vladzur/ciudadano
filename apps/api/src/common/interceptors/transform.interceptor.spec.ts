import { of } from "rxjs";
import { TransformInterceptor } from "./transform.interceptor.js";
import { ExecutionContext, CallHandler } from "@nestjs/common";

describe("TransformInterceptor", () => {
  let interceptor: TransformInterceptor;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it("should wrap plain objects in { success: true, data }", async () => {
    const context = {} as ExecutionContext;
    const handler: CallHandler = {
      handle: () => of({ id: "1", name: "test" }),
    };

    const result$ = interceptor.intercept(context, handler);
    const result = await new Promise((resolve) => result$.subscribe(resolve));

    expect(result).toEqual({ success: true, data: { id: "1", name: "test" } });
  });

  it("should wrap arrays in { success: true, data }", async () => {
    const context = {} as ExecutionContext;
    const handler: CallHandler = {
      handle: () => of([1, 2, 3]),
    };

    const result$ = interceptor.intercept(context, handler);
    const result = await new Promise((resolve) => result$.subscribe(resolve));

    expect(result).toEqual({ success: true, data: [1, 2, 3] });
  });

  it("should not modify responses that already have 'success' property", async () => {
    const context = {} as ExecutionContext;
    const handler: CallHandler = {
      handle: () => of({ success: true, data: { id: "1" }, meta: { total: 10 } }),
    };

    const result$ = interceptor.intercept(context, handler);
    const result = await new Promise((resolve) => result$.subscribe(resolve));

    expect(result).toEqual({ success: true, data: { id: "1" }, meta: { total: 10 } });
  });

  it("should not modify string responses", async () => {
    const context = {} as ExecutionContext;
    const handler: CallHandler = {
      handle: () => of("plain string"),
    };

    const result$ = interceptor.intercept(context, handler);
    const result = await new Promise((resolve) => result$.subscribe(resolve));

    expect(result).toEqual({ success: true, data: "plain string" });
  });

  it("should not modify null responses", async () => {
    const context = {} as ExecutionContext;
    const handler: CallHandler = {
      handle: () => of(null),
    };

    const result$ = interceptor.intercept(context, handler);
    const result = await new Promise((resolve) => result$.subscribe(resolve));

    expect(result).toEqual({ success: true, data: null });
  });
});
