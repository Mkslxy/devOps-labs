export type MagicQuestionType =
    | "single_choice"
    | "multiple_choice"
    | "open_text"
    | "fill_in_the_blank"
    | "matching"
    | "ordering";

export const MAGIC_QUESTION_TYPE_LABELS: Record<MagicQuestionType, string> = {
    single_choice: "Один правильний варіант",
    multiple_choice: "Кілька правильних варіантів",
    open_text: "Відкрита відповідь",
    fill_in_the_blank: "Заповнення пропусків",
    matching: "Встановлення відповідності",
    ordering: "Правильна послідовність",
};

export interface MagicQuestionOption {
    option_text: string;
    is_correct: boolean;
    explanation?: string;
    correct_order?: number;
    match_pair_text?: string;
    blank_group_id?: number;
}

export interface MagicQuestion {
    text: string;
    type: MagicQuestionType;
    points: number;
    options: MagicQuestionOption[];
}

export interface MagicTestPayload {
    photo: File;
}

export interface MagicTestResponse {
    questions: MagicQuestion[];
}