import { describe, it, expect, vi, beforeEach } from "vitest";

// mock 掉 Review 模型与 cloudinary，避免触碰真实数据库/网络
vi.mock("../../models/review", () => ({
  default: { aggregate: vi.fn() },
}));
vi.mock("../../cloud", () => ({
  default: { uploader: { upload: vi.fn(), destroy: vi.fn() } },
}));

import {
  sendError,
  handleNotFound,
  generateRandomByte,
  uploadImageToCloud,
  formateActor,
  averageRatingPipeline,
  relatedMovieAggregation,
  topRatedMoviesPipeline,
  getAverageRatings,
  getAverageRatingsMap,
} from "../../utils/helper";
import Review from "../../models/review";
import cloudinary from "../../cloud";

const mockRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() }) as any;

describe("sendError", () => {
  it("responds with error and default status 401", () => {
    const res = mockRes();
    sendError(res, "boom");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "boom" });
  });

  it("responds with provided statusCode", () => {
    const res = mockRes();
    sendError(res, "missing", 404);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("handleNotFound", () => {
  it("responds 404 with Not Found", () => {
    const res = mockRes();
    handleNotFound({} as any, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Not Found!" });
  });
});

describe("generateRandomByte", () => {
  it("resolves to a 60-char hex string (30 bytes)", async () => {
    const result = await generateRandomByte();
    expect(result).toMatch(/^[0-9a-f]{60}$/);
  });
});

describe("formateActor", () => {
  it("maps actor doc to public shape", () => {
    const actor = { _id: "abc", name: "N", about: "A", gender: "M", avatar: { url: "u" } };
    expect(formateActor(actor)).toEqual({ id: "abc", name: "N", about: "A", gender: "M", avatar: "u" });
  });

  it("omits avatar when absent", () => {
    const actor = { _id: "abc", name: "N", about: "A", gender: "M" };
    expect(formateActor(actor).avatar).toBeUndefined();
  });
});

describe("averageRatingPipeline", () => {
  it("builds match + group stages for a movieId", () => {
    const pipeline = averageRatingPipeline("movie-1") as any[];
    expect(pipeline[0].$match.parentMovie).toBe("movie-1");
    expect(pipeline[1].$group.ratingAvg.$avg).toBe("$rating");
    expect(pipeline[1].$group.reviewCount.$sum).toBe(1);
  });
});

describe("relatedMovieAggregation", () => {
  it("matches shared tags, excludes self, limits to 5", () => {
    const pipeline = relatedMovieAggregation(["action", "drama"], "movie-1") as any[];
    expect(pipeline[0].$match.tags.$in).toEqual(["action", "drama"]);
    expect(pipeline[0].$match._id.$ne).toBe("movie-1");
    expect(pipeline[2].$limit).toBe(5);
  });
});

describe("topRatedMoviesPipeline", () => {
  it("defaults to public movies that have reviews", () => {
    const pipeline = topRatedMoviesPipeline() as any[];
    expect(pipeline[0].$match.status.$eq).toBe("public");
    expect(pipeline[0].$match.reviews.$ne).toEqual([]);
    expect(pipeline[0].$match.genres).toBeUndefined();
    expect(pipeline[2].$sort.reviewCount).toBe(-1);
  });

  it("filters by genre when provided", () => {
    const pipeline = topRatedMoviesPipeline("Drama") as any[];
    expect(pipeline[0].$match.genres.$in).toEqual(["Drama"]);
  });
});

describe("getAverageRatings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty object when no reviews", async () => {
    (Review.aggregate as any).mockResolvedValue([]);
    const result = await getAverageRatings("movie-1");
    expect(result).toEqual({});
  });

  it("returns formatted rating and count", async () => {
    (Review.aggregate as any).mockResolvedValue([{ ratingAvg: 8.5, reviewCount: 3 }]);
    const result = await getAverageRatings("movie-1");
    expect(result).toEqual({ ratingAvg: "8.5", reviewCount: 3 });
  });
});

describe("getAverageRatingsMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty Map for empty input", async () => {
    const result = await getAverageRatingsMap([]);
    expect(result.size).toBe(0);
    expect(Review.aggregate).not.toHaveBeenCalled();
  });

  it("maps movie id to rating info", async () => {
    (Review.aggregate as any).mockResolvedValue([
      { _id: { toString: () => "m1" }, ratingAvg: 9, reviewCount: 2 },
    ]);
    const result = await getAverageRatingsMap(["m1"]);
    expect(result.get("m1")).toEqual({ ratingAvg: "9.0", reviewCount: 2 });
  });
});

describe("uploadImageToCloud", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads and returns url + public_id", async () => {
    (cloudinary.uploader.upload as any).mockResolvedValue({
      secure_url: "https://res.cloudinary.com/x/avatar.jpg",
      public_id: "avatar-1",
    });
    const result = await uploadImageToCloud("/tmp/avatar.jpg");
    expect(result).toEqual({ url: "https://res.cloudinary.com/x/avatar.jpg", public_id: "avatar-1" });
    expect(cloudinary.uploader.upload).toHaveBeenCalledWith("/tmp/avatar.jpg", expect.any(Object));
  });
});
