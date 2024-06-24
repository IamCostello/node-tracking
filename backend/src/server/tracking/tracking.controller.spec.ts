import { Request, Response } from "express";
import { trackingController } from "./tracking.controller";
import { TrackingService } from "./tracking.service";

const mockTrackingService = {
  getByUserId: jest.fn(),
  save: jest.fn(),
  refresh: jest.fn(),
  track: jest.fn(),
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Tracking Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { body: {}, get: jest.fn() };
    res = mockResponse();
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("saveSession", () => {
    it("should create a new session if no session exists", async () => {
      req.body = { userId: "test-uuid" };
      mockTrackingService.getByUserId.mockResolvedValueOnce(null);
      mockTrackingService.save.mockResolvedValueOnce({
        userId: "test-uuid",
        activeSessionId: "new-session-id",
      });

      const controller = trackingController(
        mockTrackingService as unknown as TrackingService
      );
      await controller.saveSession(req as Request, res as Response);

      expect(mockTrackingService.getByUserId).toHaveBeenCalledWith("test-uuid");
      expect(mockTrackingService.save).toHaveBeenCalledWith("test-uuid");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        userId: "test-uuid",
        activeSessionId: "new-session-id",
      });
    });

    it("should refresh an existing session", async () => {
      req.body = { userId: "test-uuid" };
      mockTrackingService.getByUserId.mockResolvedValueOnce({
        userId: "test-uuid",
        activeSessionId: "existing-session-id",
      });
      mockTrackingService.refresh.mockResolvedValueOnce({
        userId: "test-uuid",
        activeSessionId: "refreshed-session-id",
      });

      const controller = trackingController(
        mockTrackingService as unknown as TrackingService
      );
      await controller.saveSession(req as Request, res as Response);

      expect(mockTrackingService.getByUserId).toHaveBeenCalledWith("test-uuid");
      expect(mockTrackingService.refresh).toHaveBeenCalledWith("test-uuid");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        userId: "test-uuid",
        activeSessionId: "refreshed-session-id",
      });
    });

    it("should handle errors", async () => {
      req.body = { userId: "test-uuid" };
      mockTrackingService.getByUserId.mockRejectedValueOnce(new Error("Error"));

      const controller = trackingController(
        mockTrackingService as unknown as TrackingService
      );
      await controller.saveSession(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to save session",
      });
    });
  });

  describe("refreshSession", () => {
    it("should refresh session successfully", async () => {
      req.body = { userId: "test-uuid" };
      mockTrackingService.refresh.mockResolvedValueOnce({
        userId: "test-uuid",
        activeSessionId: "refreshed-session-id",
      });

      const controller = trackingController(
        mockTrackingService as unknown as TrackingService
      );
      await controller.refreshSession(req as Request, res as Response);

      expect(mockTrackingService.refresh).toHaveBeenCalledWith("test-uuid");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        session: {
          userId: "test-uuid",
          activeSessionId: "refreshed-session-id",
        },
      });
    });

    it("should return 404 if session is not found", async () => {
      req.body = { userId: "test-uuid" };
      mockTrackingService.refresh.mockResolvedValueOnce(null);

      const controller = trackingController(
        mockTrackingService as unknown as TrackingService
      );
      await controller.refreshSession(req as Request, res as Response);

      expect(mockTrackingService.refresh).toHaveBeenCalledWith("test-uuid");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Session not found" });
    });
  });

  describe("trackAction", () => {
    it("should track action successfully", async () => {
      req.body = { userId: "test-uuid", action: "click" };
      mockTrackingService.getByUserId.mockResolvedValueOnce({
        userId: "test-uuid",
        sessionId: "session-id",
      });

      const controller = trackingController(
        mockTrackingService as unknown as TrackingService
      );
      await controller.trackAction(req as Request, res as Response);

      expect(mockTrackingService.getByUserId).toHaveBeenCalledWith("test-uuid");
      expect(mockTrackingService.track).toHaveBeenCalledWith(
        "test-uuid",
        "session-id",
        "click",
        undefined
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        userId: "test-uuid",
        sessionId: "session-id",
      });
    });

    it("should return 404 if session is not found", async () => {
      req.body = { userId: "test-uuid", action: "click" };
      mockTrackingService.getByUserId.mockResolvedValueOnce(null);

      const controller = trackingController(
        mockTrackingService as unknown as TrackingService
      );
      await controller.trackAction(req as Request, res as Response);

      expect(mockTrackingService.getByUserId).toHaveBeenCalledWith("test-uuid");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Session not found" });
      expect(mockTrackingService.track).not.toHaveBeenCalled();
    });
  });
});
