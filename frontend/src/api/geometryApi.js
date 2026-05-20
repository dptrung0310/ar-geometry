/**
 * Stub API cho Geometry Engine.
 * Hiện tại trả về mock data.
 * Sau khi backend sẵn sàng, chỉ cần thay đổi phần implementation
 * của các hàm này — interface giữ nguyên.
 */

import MOCK_GEOMETRY_PROBLEMS from "../data/mockGeometryOutput";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Delay giả lập độ trễ mạng
const fakeDelay = (ms = 800) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Phân tích ảnh đề bài qua OCR → LLM → Geometry Engine.
 * Hiện tại: giả lập response bằng mock data ngẫu nhiên.
 *
 * @param {File} imageFile - File ảnh từ input upload
 * @returns {Promise<GeometryEngineOutput>}
 */
export async function analyzeImageProblem(imageFile) {
  // ── STUB: Khi backend sẵn sàng, thay bằng:
  // const formData = new FormData();
  // formData.append("image", imageFile);
  // const res = await fetch(`${API_BASE}/api/analyze`, {
  //   method: "POST",
  //   body: formData,
  // });
  // if (!res.ok) throw new Error("Lỗi phân tích ảnh từ server");
  // return res.json();

  await fakeDelay(1200); // Giả lập OCR + LLM processing time

  // Trả về mock data ngẫu nhiên
  const randomIdx = Math.floor(Math.random() * MOCK_GEOMETRY_PROBLEMS.length);
  return MOCK_GEOMETRY_PROBLEMS[randomIdx];
}

/**
 * Lấy danh sách các bài toán mẫu có sẵn.
 * Hiện tại: trả về mock data.
 *
 * @returns {Promise<GeometryEngineOutput[]>}
 */
export async function fetchProblems() {
  // ── STUB: Khi backend sẵn sàng, thay bằng:
  // const res = await fetch(`${API_BASE}/api/problems`);
  // if (!res.ok) throw new Error("Lỗi lấy danh sách bài toán");
  // return res.json();

  await fakeDelay(300);
  return MOCK_GEOMETRY_PROBLEMS;
}

/**
 * Lấy một bài toán theo ID.
 *
 * @param {string} id - ID của bài toán (e.g. "pyramid_square")
 * @returns {Promise<GeometryEngineOutput>}
 */
export async function fetchProblemById(id) {
  // ── STUB: Khi backend sẵn sàng, thay bằng:
  // const res = await fetch(`${API_BASE}/api/problems/${id}`);
  // if (!res.ok) throw new Error(`Không tìm thấy bài toán: ${id}`);
  // return res.json();

  await fakeDelay(300);
  const found = MOCK_GEOMETRY_PROBLEMS.find((p) => p.id === id);
  if (!found) throw new Error(`Không tìm thấy bài toán với id: ${id}`);
  return found;
}
