"use client";

import { useState } from "react";
import { saveBuiltQuizAction } from "../actions";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

export default function QuizBuilderClient() {
  const router = useRouter();
  const [title, setTitle] = useState("My Awesome Quiz");
  const [description, setDescription] = useState("");
  
  const [questions, setQuestions] = useState([
    {
      id: "q-1",
      text: "",
      difficulty: "MEDIUM",
      points: 10,
      timeLimit: 30,
      correctOptionId: "opt-1",
      options: [
        { id: "opt-1", text: "" },
        { id: "opt-2", text: "" },
      ]
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);

  function addQuestion() {
    const opt1 = uuidv4();
    const opt2 = uuidv4();
    setQuestions([
      ...questions, 
      {
        id: uuidv4(),
        text: "",
        difficulty: "MEDIUM",
        points: 10,
        timeLimit: 30,
        correctOptionId: opt1,
        options: [
          { id: opt1, text: "" },
          { id: opt2, text: "" },
        ]
      }
    ]);
  }

  function updateQuestion(qId: string, field: string, value: any) {
    setQuestions(questions.map(q => q.id === qId ? { ...q, [field]: value } : q));
  }

  function removeQuestion(qId: string) {
    if (questions.length <= 1) return;
    setQuestions(questions.filter(q => q.id !== qId));
  }

  function addOption(qId: string) {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      if (q.options.length >= 6) return q; // Max 6 options
      return {
        ...q,
        options: [...q.options, { id: uuidv4(), text: "" }]
      };
    }));
  }

  function updateOption(qId: string, optId: string, value: string) {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      return {
        ...q,
        options: q.options.map(opt => opt.id === optId ? { ...opt, text: value } : opt)
      };
    }));
  }

  function removeOption(qId: string, optId: string) {
    setQuestions(questions.map(q => {
      if (q.id !== qId) return q;
      if (q.options.length <= 2) return q; // Min 2 options
      
      const newOptions = q.options.filter(o => o.id !== optId);
      let newCorrect = q.correctOptionId;
      if (newCorrect === optId) {
        newCorrect = newOptions[0].id;
      }

      return {
        ...q,
        correctOptionId: newCorrect,
        options: newOptions
      };
    }));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const payload = JSON.stringify({
        title,
        description,
        questions
      });
      const result = await saveBuiltQuizAction(payload);
      if (result.success) {
        router.push(`/admin/manage`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save quiz");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h3 className="mb-4 text-xl">Quiz Details</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Title</label>
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="input" 
              placeholder="Quiz Title" 
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <input 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="input" 
              placeholder="Optional description" 
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white/5 p-6 rounded-xl border border-white/10 relative">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg">Question {index + 1}</h4>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(q.id)} className="text-danger hover:text-red-400">
                  <Trash2 size={20} />
                </button>
              )}
            </div>
            
            <input 
              value={q.text} 
              onChange={e => updateQuestion(q.id, 'text', e.target.value)} 
              className="input mb-4" 
              placeholder="Enter question text..." 
            />

            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-1 block">Difficulty</label>
                <select 
                  value={q.difficulty}
                  onChange={e => updateQuestion(q.id, 'difficulty', e.target.value)}
                  className="input bg-black/40"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-1 block">Points</label>
                <input 
                  type="number"
                  value={q.points}
                  onChange={e => updateQuestion(q.id, 'points', parseInt(e.target.value) || 0)}
                  className="input bg-black/40"
                  min="0"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-1 block">Time Limit (s)</label>
                <input 
                  type="number"
                  value={q.timeLimit}
                  onChange={e => updateQuestion(q.id, 'timeLimit', parseInt(e.target.value) || 30)}
                  className="input bg-black/40"
                  min="5"
                  max="300"
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="text-sm text-gray-400 block mb-2">Options (Select Correct)</label>
              <div className="flex flex-col gap-3">
                {q.options.map((opt, oIndex) => (
                  <div key={opt.id} className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-white/5">
                    <input 
                      type="radio" 
                      name={`correct-${q.id}`} 
                      checked={q.correctOptionId === opt.id}
                      onChange={() => updateQuestion(q.id, 'correctOptionId', opt.id)}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                    <input 
                      value={opt.text}
                      onChange={e => updateOption(q.id, opt.id, e.target.value)}
                      className="flex-1 bg-transparent border-none text-white focus:outline-none focus:ring-0"
                      placeholder={`Option ${oIndex + 1}`}
                    />
                    {q.options.length > 2 && (
                      <button onClick={() => removeOption(q.id, opt.id)} className="text-gray-500 hover:text-danger px-2">
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {q.options.length < 6 && (
                <button 
                  onClick={() => addOption(q.id)}
                  className="text-primary text-sm mt-3 hover:underline flex items-center gap-1"
                >
                  <Plus size={16} /> Add Option
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4">
        <button onClick={addQuestion} className="btn btn-secondary border border-white/20">
          <Plus size={18} /> Add Question
        </button>
        <button onClick={handleSave} disabled={isSaving} className="btn bg-success hover:bg-emerald-600">
          <Save size={18} /> {isSaving ? "Saving..." : "Save & Start Quiz"}
        </button>
      </div>
    </div>
  );
}
