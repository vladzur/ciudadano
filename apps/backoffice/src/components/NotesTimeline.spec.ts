import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import NotesTimeline from "./NotesTimeline.vue";
import type { IInternalNote } from "@ciudadano/shared";

describe("NotesTimeline", () => {
  const mockNotes: IInternalNote[] = [
    {
      id: "note-1",
      report_id: "uuid-1",
      content: "Se asignó equipo de bacheo",
      created_by: "admin@villarrica.cl",
      created_at: "2025-01-15T10:00:00Z",
    },
    {
      id: "note-2",
      report_id: "uuid-1",
      content: "Trabajo en progreso",
      created_by: "staff@villarrica.cl",
      created_at: "2025-01-16T14:00:00Z",
    },
  ];

  it("should render notes with content and author", () => {
    const wrapper = mount(NotesTimeline, {
      props: { notes: mockNotes },
    });

    expect(wrapper.text()).toContain("Se asignó equipo de bacheo");
    expect(wrapper.text()).toContain("Trabajo en progreso");
    expect(wrapper.text()).toContain("admin@villarrica.cl");
    expect(wrapper.text()).toContain("staff@villarrica.cl");
  });

  it("should show empty message when no notes", () => {
    const wrapper = mount(NotesTimeline, {
      props: { notes: [] },
    });

    expect(wrapper.text()).toContain("Sin notas de seguimiento aún");
  });

  it("should render correct number of note items", () => {
    const wrapper = mount(NotesTimeline, {
      props: { notes: mockNotes },
    });

    // 2 notas + no hay wrapper vacío
    expect(wrapper.findAll(".border-l-2")).toHaveLength(2);
  });
});
