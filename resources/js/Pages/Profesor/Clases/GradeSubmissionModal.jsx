import { useState } from 'react';
import axios from 'axios';
import { X, Star, Save, AlertCircle, Loader2, Award, MessageSquare, Users, TrendingUp, CheckCircle, Sparkles } from 'lucide-react';

export default function GradeSubmissionModal({ submission, task, onClose, onGraded }) {
  const [score, setScore] = useState(submission?.score || '');
  const [feedback, setFeedback] = useState(submission?.teacher_feedback || '');
  const [useIndividualGrading, setUseIndividualGrading] = useState(false);
  const [individualScores, setIndividualScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!score && !useIndividualGrading) {
      setError('La calificación es requerida');
      return;
    }

    const numericScore = parseFloat(score);
    if (!useIndividualGrading && (isNaN(numericScore) || numericScore < 0 || numericScore > task.max_score)) {
      setError(`La calificación debe estar entre 0 y ${task.max_score}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        score: useIndividualGrading ? 0 : numericScore,
        teacher_feedback: feedback.trim() || null,
      };

      if (useIndividualGrading && task.work_type !== 'individual') {
        const indScores = [];

        // Creador
        indScores.push({
          student_id: submission.student.id,
          score: parseFloat(individualScores[submission.student.id]?.score || score) || numericScore,
          feedback: individualScores[submission.student.id]?.feedback || feedback.trim() || null,
        });

        // Miembros
        submission.members?.forEach((member) => {
          const memberScore = individualScores[member.student_id]?.score;
          if (memberScore) {
            indScores.push({
              student_id: member.student_id,
              score: parseFloat(memberScore),
              feedback: individualScores[member.student_id]?.feedback || null,
            });
          }
        });

        if (indScores.length > 0) {
          payload.individual_scores = indScores;
        }
      }

      // ✅ CAMBIO: Usar PUT en lugar de POST para actualizaciones
      const method = submission.status === 'graded' ? 'put' : 'post';
      const { data } = await axios[method](
        `/profesor/clases/tasks/submissions/${submission.uuid}/grade`,
        payload
      );
      onGraded(data.submission);
      onClose();
    } catch (err) {
      console.error('Error al calificar:', err);
      setError(err.response?.data?.message || 'Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualChange = (studentId, field, value) => {
    setIndividualScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const getScoreColor = (val) => {
    if (!val) return 'text-gray-300';
    const perc = (parseFloat(val) / task.max_score) * 100;
    if (perc >= 90) return 'text-emerald-500';
    if (perc >= 80) return 'text-blue-500';
    if (perc >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBgColor = (val) => {
    if (!val) return 'bg-gray-50 border-gray-200';
    const perc = (parseFloat(val) / task.max_score) * 100;
    if (perc >= 90) return 'bg-emerald-50 border-emerald-200';
    if (perc >= 80) return 'bg-blue-50 border-blue-200';
    if (perc >= 60) return 'bg-amber-50 border-amber-200';
    return 'bg-rose-50 border-rose-200';
  };

  const getScorePercentage = (val) => {
    if (!val) return 0;
    return Math.round((parseFloat(val) / task.max_score) * 100);
  };

  const getProgressBarColor = (val) => {
    const perc = getScorePercentage(val);
    if (perc >= 90) return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
    if (perc >= 80) return 'bg-gradient-to-r from-blue-400 to-indigo-500';
    if (perc >= 60) return 'bg-gradient-to-r from-amber-400 to-amber-500';
    return 'bg-gradient-to-r from-rose-400 to-rose-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-blue-50/50">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
              <Star className="h-6 w-6 text-white" fill="white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-gray-800 truncate">
                {submission.status === 'graded' ? 'Editar Calificación' : 'Calificar Entrega'}
              </h2>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <span className="truncate">{submission.student?.name}</span>
                {submission.is_creator && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                    Creador
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/60 rounded-xl transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">

          {/* Info Cards - Más ligeras */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-blue-100/50 shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tipo</p>
                <p className="text-sm font-semibold text-gray-800">
                  {task.work_type === 'individual' ? 'Individual' : task.work_type === 'pairs' ? 'Pareja' : 'Grupo'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-indigo-100/50 shadow-sm">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Integrantes</p>
                <p className="text-sm font-semibold text-gray-800">{submission.members?.length + 1}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-emerald-100/50 shadow-sm">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado</p>
                <p className="text-sm font-semibold text-emerald-600">Entregado</p>
              </div>
            </div>
          </div>

          {/* Toggle Calificación Individual - Más sutil */}
          {task.work_type !== 'individual' && submission?.members?.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-violet-100/50 shadow-sm">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={useIndividualGrading}
                    onChange={(e) => setUseIndividualGrading(e.target.checked)}
                    className="w-5 h-5 text-violet-500 rounded-md border-gray-300 focus:ring-violet-400 focus:ring-offset-0 transition-all cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    <p className="font-semibold text-gray-800">Calificar individualmente</p>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Asignar calificaciones personalizadas a cada integrante según su desempeño
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Calificación Grupal - Más elegante */}
          {!useIndividualGrading && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <label className="text-lg font-semibold text-gray-800">Calificación Grupal</label>
              </div>

              <div className="flex items-center gap-8">
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={task.max_score}
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className={`w-36 text-center text-5xl font-bold border-2 rounded-2xl p-4 transition-all outline-none ${error
                      ? 'border-rose-300 bg-rose-50 text-rose-600'
                      : score
                        ? `${getScoreBgColor(score)} ${getScoreColor(score)} focus:ring-2 focus:ring-offset-2 ${getScorePercentage(score) >= 90 ? 'focus:ring-emerald-200' :
                          getScorePercentage(score) >= 80 ? 'focus:ring-blue-200' :
                            getScorePercentage(score) >= 60 ? 'focus:ring-amber-200' :
                              'focus:ring-rose-200'
                        }`
                        : 'border-gray-200 bg-gray-50 text-gray-300 focus:border-blue-300 focus:ring-2 focus:ring-blue-100'
                      }`}
                    placeholder="0.0"
                  />
                  {score && (
                    <div className={`absolute -top-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${getScorePercentage(score) >= 90 ? 'bg-gradient-to-br from-emerald-400 to-emerald-500' :
                      getScorePercentage(score) >= 80 ? 'bg-gradient-to-br from-blue-400 to-blue-500' :
                        getScorePercentage(score) >= 60 ? 'bg-gradient-to-br from-amber-400 to-amber-500' :
                          'bg-gradient-to-br from-rose-400 to-rose-500'
                      }`}>
                      {getScorePercentage(score)}%
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-light text-gray-300">/</span>
                    <span className="text-3xl font-semibold text-gray-600">{task.max_score}</span>
                    <span className="text-sm text-gray-400 font-medium">puntos</span>
                  </div>

                  {score && (
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${getProgressBarColor(score)}`}
                        style={{ width: `${getScorePercentage(score)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-5 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-rose-700 text-sm font-medium">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Lista de Participantes - Más limpia */}
          {task.work_type !== 'individual' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Integrantes del Grupo</h3>
              </div>

              {/* Creador */}
              <div className="bg-white rounded-2xl p-5 border border-blue-100/50 shadow-sm">
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-md">
                        {submission.student?.name?.charAt(0)}
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <Star className="h-2.5 w-2.5 text-amber-900" fill="currentColor" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 truncate">{submission.student?.name}</p>
                      <p className="text-xs text-blue-600 font-medium">Creador del grupo</p>
                    </div>
                  </div>

                  {useIndividualGrading && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={task.max_score}
                        value={individualScores[submission.student.id]?.score || score}
                        onChange={(e) => handleIndividualChange(submission.student.id, 'score', e.target.value)}
                        className={`w-20 text-center text-lg font-semibold border-2 rounded-lg p-2 transition-all outline-none ${individualScores[submission.student.id]?.score
                          ? `${getScoreBgColor(individualScores[submission.student.id]?.score)} ${getScoreColor(individualScores[submission.student.id]?.score)}`
                          : 'border-gray-200 bg-gray-50 text-gray-400'
                          } focus:ring-2 focus:ring-blue-200`}
                        placeholder="0.0"
                      />
                      <span className="text-sm font-medium text-gray-400">/ {task.max_score}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Miembros */}
              {submission.members?.map((member, index) => (
                <div
                  key={member.student_id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-gray-200 transition-all"
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-600 font-semibold text-lg shadow-sm">
                        {member.student?.name?.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 truncate">{member.student?.name}</p>
                        <p className="text-xs text-gray-500">Integrante</p>
                      </div>
                    </div>

                    {useIndividualGrading && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max={task.max_score}
                          value={individualScores[member.student_id]?.score || ''}
                          onChange={(e) => handleIndividualChange(member.student_id, 'score', e.target.value)}
                          className={`w-20 text-center text-lg font-semibold border-2 rounded-lg p-2 transition-all outline-none ${individualScores[member.student_id]?.score
                            ? `${getScoreBgColor(individualScores[member.student_id]?.score)} ${getScoreColor(individualScores[member.student_id]?.score)}`
                            : 'border-gray-200 bg-gray-50 text-gray-400'
                            } focus:ring-2 focus:ring-blue-200`}
                          placeholder="0.0"
                        />
                        <span className="text-sm font-medium text-gray-400">/ {task.max_score}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Retroalimentación - Más sutil */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <label className="text-lg font-semibold text-gray-800">Retroalimentación</label>
            </div>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-300 resize-none transition-all text-gray-700 text-sm outline-none bg-gray-50/50"
              placeholder="Comentarios sobre el trabajo, aspectos destacados y sugerencias de mejora..."
            />
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Visible para todos los integrantes
            </p>
          </div>
        </div>

        {/* Footer - Más limpio */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center gap-4">
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>Notificación automática a estudiantes</span>
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-white transition-all font-medium text-gray-600"
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {/* ✅ Texto dinámico según si ya está calificado */}
                  <span>{submission.status === 'graded' ? 'Actualizar Calificación' : 'Guardar Calificación'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}