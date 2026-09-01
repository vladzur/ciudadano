import type { Firestore } from "firebase-admin/firestore";
import { HealthController } from "./health.controller.js";
import { createMockFirestore, type MockFirestore } from "../../testing/firestore.mock.js";

describe("HealthController", () => {
  let db: MockFirestore;
  let controller: HealthController;

  beforeEach(() => {
    db = createMockFirestore();
    controller = new HealthController(db as unknown as Firestore);
  });

  it("should report ok when Firestore responds", async () => {
    const result = await controller.check();

    expect(result.status).toBe("ok");
    expect(result.firestore).toBe(true);
    expect(typeof result.timestamp).toBe("string");
  });

  it("should report degraded when Firestore fails", async () => {
    // Simula una conexión caída con una query que rechaza
    const failingDb = {
      collection: jest.fn(() => ({
        limit: jest.fn(function (this: unknown) {
          return this;
        }),
        get: jest.fn(() => Promise.reject(new Error("conexión caída"))),
      })),
    };
    const failingController = new HealthController(
      failingDb as unknown as Firestore
    );

    const result = await failingController.check();

    expect(result.status).toBe("degraded");
    expect(result.firestore).toBe(false);
  });
});
