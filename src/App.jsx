import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle,
  Calendar as CalendarIcon,
  Clock,
  Timer,
  Pencil,
  X,
  Check,
  CheckCircle
} from 'lucide-react';

const App = () => {
  // Состояние навигации по датам
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Состояние списка событий
  const [events, setEvents] = useState([]);
  const [newEventText, setNewEventText] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(30);
  
  // ────────────────────────────────────────────────
  // Один эффект для загрузки (срабатывает только один раз)
useEffect(() => {
  try {
    const saved = localStorage.getItem('calendar-events');
    if (saved && saved !== 'undefined' && saved !== '[]') {  // избегаем перезаписи пустым
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setEvents(parsed);
      }
    }
  } catch (e) {
    console.warn("localStorage битый → очищаем");
    localStorage.removeItem('calendar-events');
  }
}, []);

// Отдельный эффект только для сохранения
useEffect(() => {
  localStorage.setItem('calendar-events', JSON.stringify(events));
}, [events]);

  // Состояние редактирования
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editDuration, setEditDuration] = useState(30);

  // Логика календаря
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = daysInMonth(year, month);
    let firstDay = firstDayOfMonth(year, month) - 1;
    if (firstDay === -1) firstDay = 6;

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: null, currentMonth: false });
    for (let i = 1; i <= daysCount; i++) {
      days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }
    return days;
  }, [currentDate]);

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

  const changeMonth = (offset) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Функция расчета времени окончания
  const calculateEndTime = (startStr, durationMin) => {
    if (!startStr) return "";
    const [hours, minutes] = startStr.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0);
    
    const endDate = new Date(startDate.getTime() + durationMin * 60000);
    return endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  // Обработчики событий
  const addEvent = () => {
    if (!newEventText.trim()) return;
    const newEvent = {
      id: Date.now(),
      text: newEventText,
      date: selectedDate.toDateString(),
      startTime: startTime || null,
      duration: startTime ? duration : null,
      completed: false
    };
    setEvents([...events, newEvent]);
    setNewEventText('');
    setStartTime('');
  };

  const startEditing = (event) => {
    setEditingId(event.id);
    setEditText(event.text);
    setEditStartTime(event.startTime || '');
    setEditDuration(event.duration || 30);
  };

  const saveEdit = () => {
    setEvents(events.map(ev => 
      ev.id === editingId 
        ? { ...ev, text: editText, startTime: editStartTime || null, duration: editStartTime ? editDuration : null }
        : ev
    ));
    setEditingId(null);
  };

  const toggleEvent = (id) => setEvents(events.map(ev => ev.id === id ? { ...ev, completed: !ev.completed } : ev));
  const deleteEvent = (id) => setEvents(events.filter(ev => ev.id !== id));

  const filteredEvents = useMemo(() => {
    const daily = events.filter(ev => ev.date === selectedDate.toDateString());
    const tasks = daily.filter(ev => !ev.startTime);
    const timedEvents = daily
      .filter(ev => ev.startTime)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return { tasks, timedEvents };
  }, [events, selectedDate]);

  // Расширенная проверка статуса дня
  const getDayStats = (date) => {
    if (!date) return { hasTasks: false, hasTimed: false, completed: 0, total: 0 };
    const dateStr = date.toDateString();
    const dayEvents = events.filter(ev => ev.date === dateStr);
    return {
      hasTasks: dayEvents.some(ev => !ev.startTime),
      hasTimed: dayEvents.some(ev => ev.startTime),
      completed: dayEvents.filter(ev => ev.completed).length,
      total: dayEvents.length
    };
  };

  // Функция для определения цвета фона дня в зависимости от нагрузки
  const getIntensityClass = (total, isSelected) => {
    if (isSelected) return 'bg-indigo-600 text-white shadow-md scale-105 z-10';
    if (total === 0) return 'text-slate-700 hover:bg-indigo-50';
    if (total <= 2) return 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100';
    if (total <= 4) return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
    return 'bg-indigo-200 text-indigo-900 hover:bg-indigo-300';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 leading-relaxed">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Календарь */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 h-fit">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">
              {monthNames[currentDate.getMonth()]} <span className="text-slate-400 font-medium">{currentDate.getFullYear()}</span>
            </h2>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft size={24} /></button>
              <button onClick={goToToday} className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">Сегодня</button>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronRight size={24} /></button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-7 mb-4">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarData.map((item, index) => {
                const isSelected = item.date && item.date.toDateString() === selectedDate.toDateString();
                const isToday = item.date && item.date.toDateString() === new Date().toDateString();
                const stats = getDayStats(item.date);
                const isDayCompleted = stats.total > 0 && stats.completed === stats.total;
                
                return (
                  <div key={index} onClick={() => item.date && setSelectedDate(item.date)}
                    className={`aspect-square flex flex-col items-center justify-between py-2 relative cursor-pointer rounded-xl transition-all
                      ${!item.currentMonth ? 'opacity-0 pointer-events-none' : ''}
                      ${getIntensityClass(stats.total, isSelected)}
                      ${isToday && !isSelected ? 'ring-2 ring-indigo-300 ring-offset-1' : ''}`}>
                    
                    <span className="text-lg font-medium">{item.day}</span>
                    
                    <div className="flex flex-col items-center gap-0.5">
                      {/* Счетчик прогресса */}
                      {stats.total > 0 && (
                        <div className={`flex items-center justify-center gap-1 text-[10px] font-bold mb-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                          <span>{stats.completed}/{stats.total}</span>
                          {isDayCompleted && (
                            <CheckCircle 
                              size={12} 
                              className={isSelected ? "text-indigo-200" : "text-emerald-500"} 
                              strokeWidth={3} 
                            />
                          )}
                        </div>
                      )}
                      
                      {/* Индикаторы типов */}
                      <div className="flex gap-1 h-1">
                        {stats.hasTasks && (
                          <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`}></div>
                        )}
                        {stats.hasTimed && (
                          <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Легенда */}
            <div className="mt-8 pt-6 border-t border-slate-50 flex flex-wrap gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span>Список дел</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span>Расписание</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={12} className="text-emerald-500" strokeWidth={3} />
                <span>Завершено</span>
              </div>
              <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
                <span className="mr-1 text-slate-300">Нагрузка:</span>
                <div className="w-3 h-3 bg-indigo-50 rounded-sm border border-slate-100" title="Мало дел"></div>
                <div className="w-3 h-3 bg-indigo-100 rounded-sm" title="Средне"></div>
                <div className="w-3 h-3 bg-indigo-200 rounded-sm" title="Много дел"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Список задач */}
        <div className="flex flex-col gap-6 h-full">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100 flex flex-col h-full min-h-[600px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200"><CalendarIcon size={20} /></div>
              <div>
                <h3 className="font-bold text-slate-800">План на день</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
              </div>
            </div>

            {/* Ввод */}
            <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <input type="text" value={newEventText} onChange={(e) => setNewEventText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addEvent()}
                placeholder="Что планируете?..." className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all text-sm" />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <Clock size={14} className="text-indigo-500" />
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-transparent focus:outline-none text-xs font-medium" />
                </div>
                {startTime && (
                  <div className="flex items-center gap-2 flex-grow bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    <Timer size={14} className="text-indigo-500" />
                    <input type="range" min="15" max="240" step="15" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="flex-grow accent-indigo-600" />
                    <span className="text-[10px] font-bold text-slate-500 w-8">{duration}м</span>
                  </div>
                )}
                <button onClick={addEvent} className="ml-auto bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-95"><Plus size={20} /></button>
              </div>
            </div>

            {/* Задачи */}
            <div className="flex-grow space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              {/* Секция: Список дел */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1"><div className="h-4 w-1 bg-amber-400 rounded-full"></div><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Список дел</h4></div>
                {filteredEvents.tasks.length === 0 && <p className="text-xs text-slate-400 italic px-1">Нет текущих дел</p>}
                {filteredEvents.tasks.map(event => (
                  <div key={event.id} className="group bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all shadow-sm p-3">
                    {editingId === event.id ? (
                      <div className="space-y-3">
                        <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full p-2 bg-slate-50 border rounded-lg text-sm outline-none" autoFocus />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors"><X size={18}/></button>
                          <button onClick={saveEdit} className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"><Check size={18}/></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleEvent(event.id)} className={`${event.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-400'} transition-colors`}>
                          {event.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>
                        <span className={`flex-grow text-sm ${event.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>{event.text}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditing(event)} className="p-1 text-slate-300 hover:text-indigo-500"><Pencil size={14}/></button>
                          <button onClick={() => deleteEvent(event.id)} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Секция: Расписание */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1"><div className="h-4 w-1 bg-indigo-500 rounded-full"></div><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Расписание</h4></div>
                {filteredEvents.timedEvents.length === 0 && <p className="text-xs text-slate-400 italic px-1">График свободен</p>}
                {filteredEvents.timedEvents.map(event => {
                  const endTime = calculateEndTime(event.startTime, event.duration);
                  return (
                    <div key={event.id} className="group bg-indigo-50/40 rounded-2xl border border-indigo-100/50 hover:border-indigo-300 transition-all p-3">
                      {editingId === event.id ? (
                        <div className="space-y-3">
                          <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="w-full p-2 bg-white border rounded-lg text-sm outline-none" />
                          <div className="flex items-center gap-2">
                             <input type="time" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} className="p-1.5 text-xs border rounded-lg bg-white outline-none font-medium" />
                             <input type="range" min="15" max="240" step="15" value={editDuration} onChange={(e) => setEditDuration(parseInt(e.target.value))} className="flex-grow accent-indigo-600" />
                             <span className="text-[10px] font-bold text-slate-500">{editDuration}м</span>
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t border-indigo-100/50">
                            <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors"><X size={18}/></button>
                            <button onClick={saveEdit} className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"><Check size={18}/></button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <div className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-1 rounded shadow-sm border border-indigo-100/50 whitespace-nowrap">
                              {event.startTime} — {endTime}
                            </div>
                            <span className={`flex-grow text-sm font-bold ${event.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{event.text}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditing(event)} className="p-1 text-slate-400 hover:text-indigo-500"><Pencil size={14}/></button>
                              <button onClick={() => deleteEvent(event.id)} className="p-1 text-slate-400 hover:text-rose-500"><Trash2 size={14}/></button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pl-1">
                            <button onClick={() => toggleEvent(event.id)} className={`${event.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-400'} transition-colors`}>
                              {event.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </button>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                              <Timer size={10} /> {event.duration} мин
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

