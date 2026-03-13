import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles, X, Plus, Check, Loader } from "lucide-react";
import {
  extractSkillsFromText,
  getSkillAutocomplete,
  updateUserSkills,
} from "../../utils/aiService";
import getCurrentUser from "../../utils/getCurrentUser";

/**
 * AI-Powered Skill Extraction Component
 * Extracts skills from resume/bio text and allows users to manage their skills
 */
const SkillExtractor = ({
  onSkillsUpdate,
  initialSkills = [],
  showTextInput = true,
  compact = false,
}) => {
  const [text, setText] = useState("");
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState(initialSkills);
  const [loading, setLoading] = useState(false);
  const [autocomplete, setAutocomplete] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const currentUser = getCurrentUser();

  // Extract skills from text
  const handleExtract = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const result = await extractSkillsFromText(text);
      setExtractedSkills(result.skills || []);
      setMessage({
        type: "success",
        text: `Found ${result.totalFound} skills with ${result.confidence}% confidence`,
      });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to extract skills" });
    } finally {
      setLoading(false);
    }
  };

  // Handle autocomplete search
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length >= 2) {
      try {
        const result = await getSkillAutocomplete(query, 8);
        setAutocomplete(result.suggestions || []);
        setShowAutocomplete(true);
      } catch (error) {
        setAutocomplete([]);
      }
    } else {
      setAutocomplete([]);
      setShowAutocomplete(false);
    }
  };

  // Add skill to selected
  const addSkill = (skill) => {
    const normalized = skill.toLowerCase().trim();
    if (!selectedSkills.includes(normalized)) {
      const newSkills = [...selectedSkills, normalized];
      setSelectedSkills(newSkills);
      onSkillsUpdate?.(newSkills);
    }
    setSearchQuery("");
    setShowAutocomplete(false);
  };

  // Remove skill from selected
  const removeSkill = (skill) => {
    const newSkills = selectedSkills.filter((s) => s !== skill);
    setSelectedSkills(newSkills);
    onSkillsUpdate?.(newSkills);
  };

  // Add all extracted skills
  const addAllExtracted = () => {
    const newSkills = [...new Set([...selectedSkills, ...extractedSkills])];
    setSelectedSkills(newSkills);
    onSkillsUpdate?.(newSkills);
    setExtractedSkills([]);
  };

  // Save skills to profile
  const saveSkills = async () => {
    if (!currentUser?._id) return;

    setSaving(true);
    try {
      await updateUserSkills(currentUser._id, selectedSkills);
      setMessage({ type: "success", text: "Skills saved successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save skills" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`glass rounded-2xl ${compact ? "p-4" : "p-6"}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-neonPurple" />
        <h3 className={`font-bold ${compact ? "text-lg" : "text-xl"}`}>
          {showTextInput ? "AI Skill Extractor" : "Your Skills"}
        </h3>
      </div>

      {/* Text Input for Resume/Bio */}
      {showTextInput && (
        <div className="mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your resume, bio, or describe your experience here..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 resize-none focus:border-neonPurple focus:outline-none"
            rows={4}
          />
          <button
            onClick={handleExtract}
            disabled={loading || !text.trim()}
            className="mt-2 flex items-center gap-2 bg-neonPurple hover:bg-neonPurple/80 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Extract Skills
              </>
            )}
          </button>
        </div>
      )}

      {/* Extracted Skills Preview */}
      {extractedSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-4 p-4 bg-neonPurple/10 rounded-xl border border-neonPurple/30"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neonPurple font-medium">
              Extracted {extractedSkills.length} skills
            </span>
            <button
              onClick={addAllExtracted}
              className="text-xs bg-neonPurple hover:bg-neonPurple/80 px-3 py-1 rounded-full transition-all"
            >
              Add All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {extractedSkills.slice(0, 15).map((skill) => (
              <button
                key={skill}
                onClick={() => addSkill(skill)}
                className={`text-sm px-3 py-1 rounded-full border transition-all ${
                  selectedSkills.includes(skill)
                    ? "bg-neonPurple/30 border-neonPurple text-neonPurple"
                    : "bg-white/5 border-white/20 hover:border-neonPurple"
                }`}
              >
                {skill}
                {selectedSkills.includes(skill) ? (
                  <Check className="w-3 h-3 inline ml-1" />
                ) : (
                  <Plus className="w-3 h-3 inline ml-1" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Manual Skill Search */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search or type a skill..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-neonPurple focus:outline-none"
          onFocus={() => searchQuery.length >= 2 && setShowAutocomplete(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchQuery.trim()) {
              addSkill(searchQuery);
            }
          }}
        />

        {/* Autocomplete Dropdown */}
        <AnimatePresence>
          {showAutocomplete && autocomplete.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full mt-1 bg-gray-900 border border-white/10 rounded-lg shadow-xl overflow-hidden"
            >
              {autocomplete.map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <span>{skill}</span>
                  {selectedSkills.includes(skill) && (
                    <Check className="w-4 h-4 text-green-400" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Skills */}
      <div className="mb-4">
        <span className="text-sm text-gray-400 mb-2 block">
          Selected Skills ({selectedSkills.length})
        </span>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {selectedSkills.length === 0 ? (
            <span className="text-gray-500 text-sm">
              No skills selected yet
            </span>
          ) : (
            selectedSkills.map((skill) => (
              <motion.span
                key={skill}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1 bg-neonPurple/20 text-neonPurple px-3 py-1 rounded-full text-sm"
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))
          )}
        </div>
      </div>

      {/* Save Button */}
      {currentUser && selectedSkills.length > 0 && (
        <button
          onClick={saveSkills}
          disabled={saving}
          className="w-full bg-gradient-to-r from-neonPurple to-neonBlue hover:opacity-90 disabled:opacity-50 text-white py-2 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save to Profile
            </>
          )}
        </button>
      )}

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-3 text-sm text-center ${
              message.type === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SkillExtractor;
