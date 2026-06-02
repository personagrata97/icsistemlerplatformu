import React, { useState, useEffect, useRef } from "react"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns"
import { tr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { clsx } from "clsx"
import { createPortal } from "react-dom"

export interface DatePickerProps {
  value: string | undefined // YYYY-MM-DD
  onChange: (date: string) => void
  placeholder?: string
  className?: string
  error?: boolean
  disabled?: boolean
  id?: string
  required?: boolean
}

export default function DatePicker({ value, onChange, placeholder = "Tarih seçin...", className, error, disabled, id, required }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})
  
  const selectedDate = value ? new Date(value) : null
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const dateFormat = "yyyy-MM-dd"
  const days = eachDayOfInterval({ start: startDate, end: endDate })
  
  const weekDays = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"]

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentMonth(addMonths(currentMonth, 1))
  }
  
  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const onDateClick = (day: Date, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(format(day, dateFormat))
    setIsOpen(false)
  }

  // Close when clicking outside and handle positioning
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Also check if click is inside the portal popup
        const popup = document.getElementById('datepicker-portal-content')
        if (popup && popup.contains(event.target as Node)) return;
        
        setIsOpen(false)
      }
    }
    
    function updatePosition() {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            
            // Check if there's enough space below, otherwise render above
            const spaceBelow = window.innerHeight - rect.bottom
            const popupHeight = 350 // Approximate height of the calendar
            
            const top = spaceBelow < popupHeight && rect.top > popupHeight
                ? rect.top - popupHeight - 8 + window.scrollY
                : rect.bottom + 8 + window.scrollY;
                
            setPopupStyle({
                top: `${top}px`,
                left: `${rect.left + window.scrollX}px`,
                width: '288px' // w-72 equivalent
            })
        }
    }

    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside)
        window.addEventListener("scroll", updatePosition, true)
        window.addEventListener("resize", updatePosition)
        updatePosition()
    }

    return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        window.removeEventListener("scroll", updatePosition, true)
        window.removeEventListener("resize", updatePosition)
    }
  }, [isOpen])

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Hidden native input for required validation form submission */}
      <input 
        type="text" 
        id={id} 
        value={value || ''} 
        readOnly 
        required={required} 
        className="absolute opacity-0 w-0 h-0 p-0 m-0 border-0" 
        tabIndex={-1}
      />

      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-200 select-none',
          disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white cursor-pointer',
          error
              ? 'border-rose-300 text-rose-900 hover:border-rose-400'
              : !disabled && 'border-slate-200 text-slate-900 hover:border-slate-300',
          isOpen && !error && !disabled ? 'border-primary ring-4 ring-primary/10' : '',
          className
        )}
      >
        <CalendarIcon className={clsx("w-4 h-4 mr-2", disabled ? "text-slate-300" : (error ? "text-rose-400" : "text-slate-400"))} />
        <span className={clsx("flex-1", !selectedDate && "text-slate-400")}>
          {selectedDate ? format(selectedDate, "dd.MM.yyyy", { locale: tr }) : placeholder}
        </span>
      </div>

      <AnimatePresence>
        {isOpen && createPortal(
          <motion.div
            id="datepicker-portal-content"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={popupStyle}
            className="absolute z-[99999] p-4 rounded-xl bg-white border border-slate-200 shadow-xl"
          >
            <div className="flex justify-between items-center mb-4">
              <button 
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="font-bold text-slate-800 text-sm capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: tr })}
              </div>
              <button 
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-[10px] font-bold text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                const isCurrentMonth = isSameMonth(day, monthStart)
                const isDayToday = isToday(day)

                let btnClass = "w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-sm transition-all duration-200 "
                
                if (isSelected) {
                  btnClass += "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30"
                } else if (isDayToday) {
                  btnClass += "bg-blue-50 text-blue-600 font-bold hover:bg-blue-100"
                } else if (isCurrentMonth) {
                  btnClass += "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                } else {
                  btnClass += "text-slate-400 hover:bg-slate-50"
                }

                return (
                  <button
                    key={day.toString()}
                    type="button"
                    onClick={(e) => onDateClick(day, e)}
                    className={btnClass}
                  >
                    {format(day, "d")}
                  </button>
                )
              })}
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  )
}
