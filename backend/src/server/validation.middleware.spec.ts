import { Request, Response, NextFunction } from "express";
import { validate } from "./validation.middleware";
import { z } from "zod";

const schema = z.object({
  userId: z.string().uuid(),
});

describe("Validation Middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it("should call next if validation passes", async () => {
    req.body = { userId: "00000000-0000-0000-0000-000000000000" };

    const middleware = validate(schema);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return 400 if validation fails", async () => {
    req.body = { userId: "invalid-uuid" };

    const middleware = validate(schema);
    await middleware(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid request" });
  });
});
