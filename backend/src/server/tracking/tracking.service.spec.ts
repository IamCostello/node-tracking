import { trackingService } from "./tracking.service";
import { TrackingSessionRepository } from "../../domain/tracking/trackingSession.repository";
import { TrackingActionType } from "../../domain/tracking/trackingAction";

const mockRepository = {
  findByUserId: jest.fn(),
  createSession: jest.fn(),
  refreshSession: jest.fn(),
  createAction: jest.fn(),
};

describe("Tracking Service", () => {
  let service: ReturnType<typeof trackingService>;

  beforeEach(() => {
    service = trackingService(mockRepository as TrackingSessionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getByUserId", () => {
    it("should return session if found", async () => {
      const mockSession = {
        userId: "test-uuid",
        activeSessionId: "session-id",
      };
      mockRepository.findByUserId!.mockResolvedValueOnce(mockSession);

      const result = await service.getByUserId("test-uuid");
      const expectedResult = {
        sessionId: "session-id",
      };
      expect(result).toEqual(expectedResult);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith("test-uuid");
    });

    it("should return null if session not found", async () => {
      mockRepository.findByUserId!.mockRejectedValueOnce(
        new Error("Not found")
      );

      const result = await service.getByUserId("test-uuid");
      expect(result).toBeNull();
    });
  });

  describe("save", () => {
    it("should save a new session successfully", async () => {
      const mockSession = {
        userId: "test-uuid",
        activeSessionId: "session-id",
      };
      mockRepository.createSession!.mockResolvedValueOnce(mockSession);

      const result = await service.save("test-uuid");
      const expectedResult = {
        sessionId: "session-id",
      };
      expect(result).toEqual(expectedResult);
      expect(mockRepository.createSession).toHaveBeenCalledWith("test-uuid");
    });

    it("should handle errors during save", async () => {
      mockRepository.createSession!.mockRejectedValueOnce(
        new Error("Failed to save session")
      );

      const result = await service.save("test-uuid");
      expect(result).toBeNull();
    });
  });

  describe("refresh", () => {
    it("should refresh session successfully", async () => {
      const mockSession = {
        userId: "test-uuid",
        activeSessionId: "refreshed-session-id",
      };
      mockRepository.refreshSession!.mockResolvedValueOnce(mockSession);

      const result = await service.refresh("test-uuid");
      const expectedResult = {
        sessionId: "refreshed-session-id",
      };
      expect(result).toEqual(expectedResult);
      expect(mockRepository.refreshSession).toHaveBeenCalledWith("test-uuid");
    });

    it("should return null if session not found during refresh", async () => {
      mockRepository.refreshSession!.mockRejectedValueOnce(
        new Error("Session not found")
      );

      const result = await service.refresh("test-uuid");
      expect(result).toBeNull();
    });
  });

  describe("track", () => {
    it("should track action successfully", async () => {
      const mockSession = {
        userId: "test-uuid",
        activeSessionId: "session-id",
      };
      mockRepository.createAction!.mockResolvedValueOnce(mockSession);

      const result = await service.track(
        "test-uuid",
        "session-id",
        "pageVisit"
      );
      const expectedResult = {
        sessionId: "session-id",
      };
      expect(result).toEqual(expectedResult);
      expect(mockRepository.createAction).toHaveBeenCalledWith(
        "test-uuid",
        "session-id",
        "pageVisit",
        undefined
      );
    });

    it("should handle errors during track", async () => {
      mockRepository.createAction!.mockRejectedValueOnce(
        new Error("Failed to track action")
      );

      const result = await service.track(
        "test-uuid",
        "session-id",
        "pageVisit"
      );
      expect(result).toBeNull();
    });
  });
});
