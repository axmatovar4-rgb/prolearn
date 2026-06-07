import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const LANGS = {
  uz: {
    // Umumiy
    home: 'Bosh sahifa', employees: 'Ishchilar', attendance: 'Davomat',
    salary: 'Maosh', vacation: "Ta'til", requests: "So'rovlar",
    database: 'Database', profile: 'Mening profilim', settings: 'Sozlamalar', logout: 'Chiqish',
    // Dashboard
    total_employees: 'Jami ishchilar', today_present: 'Bugun keldi',
    today_absent: 'Bugun kelmadi', monthly_salary: 'Oylik maosh',
    departments: "Bo'limlar bo'yicha", salary_status: 'Maosh holati',
    paid: "To'langan", pending: 'Kutilayotgan', total: 'Jami',
    // Ishchilar
    new_employee: 'Yangi ishchi', search_placeholder: 'Ism, telefon...',
    all_departments: "Barcha bo'limlar", name: 'Ishchi', position: 'Lavozim',
    department: "Bo'lim", phone: 'Telefon', status: 'Holat', actions: 'Amallar',
    active: 'Faol', inactive: 'Nofaol', not_found: 'Topilmadi',
    // Login
    login_title: 'Ishxona tizimi', login_subtitle: 'Hisobingizga kiring',
    login_btn: 'Kirish', loading: 'Yuklanmoqda...',
    login_placeholder: 'admin yoki Karimov Jasur',
    password: 'Parol', birth_date: "Tug'ilgan sana", card_number: 'Karta raqam',
    // Maosh
    calculate: 'Hisoblash', report: 'Hisobot', pay_all: 'Barchasiga to\'lash',
    worked_days: 'Ishlagan kun', base: 'Asosiy', bonus: 'Bonus',
    deduction: 'Jarima', card: 'Karta', pay_btn: 'To\'lash',
  },
  ru: {
    home: 'Главная', employees: 'Сотрудники', attendance: 'Посещаемость',
    salary: 'Зарплата', vacation: 'Отпуск', requests: 'Заявки',
    database: 'База данных', profile: 'Мой профиль', settings: 'Настройки', logout: 'Выход',
    total_employees: 'Всего сотрудников', today_present: 'Сегодня пришли',
    today_absent: 'Сегодня не пришли', monthly_salary: 'Месячная зарплата',
    departments: 'По отделам', salary_status: 'Статус зарплаты',
    paid: 'Выплачено', pending: 'Ожидается', total: 'Итого',
    new_employee: 'Новый сотрудник', search_placeholder: 'Имя, телефон...',
    all_departments: 'Все отделы', name: 'Сотрудник', position: 'Должность',
    department: 'Отдел', phone: 'Телефон', status: 'Статус', actions: 'Действия',
    active: 'Активен', inactive: 'Неактивен', not_found: 'Не найдено',
    login_title: 'Система офиса', login_subtitle: 'Войдите в свой аккаунт',
    login_btn: 'Войти', loading: 'Загрузка...',
    login_placeholder: 'admin или Каримов Жасур',
    password: 'Пароль', birth_date: 'Дата рождения', card_number: 'Номер карты',
    calculate: 'Рассчитать', report: 'Отчёт', pay_all: 'Выплатить всем',
    worked_days: 'Рабочих дней', base: 'Основная', bonus: 'Премия',
    deduction: 'Штраф', card: 'Карта', pay_btn: 'Оплатить',
  },
  en: {
    home: 'Dashboard', employees: 'Employees', attendance: 'Attendance',
    salary: 'Salary', vacation: 'Vacation', requests: 'Requests',
    database: 'Database', profile: 'My Profile', settings: 'Settings', logout: 'Logout',
    total_employees: 'Total Employees', today_present: 'Present Today',
    today_absent: 'Absent Today', monthly_salary: 'Monthly Salary',
    departments: 'By Departments', salary_status: 'Salary Status',
    paid: 'Paid', pending: 'Pending', total: 'Total',
    new_employee: 'New Employee', search_placeholder: 'Name, phone...',
    all_departments: 'All Departments', name: 'Employee', position: 'Position',
    department: 'Department', phone: 'Phone', status: 'Status', actions: 'Actions',
    active: 'Active', inactive: 'Inactive', not_found: 'Not found',
    login_title: 'Office System', login_subtitle: 'Sign in to your account',
    login_btn: 'Sign In', loading: 'Loading...',
    login_placeholder: 'admin or Karimov Jasur',
    password: 'Password', birth_date: 'Birth Date', card_number: 'Card Number',
    calculate: 'Calculate', report: 'Report', pay_all: 'Pay All',
    worked_days: 'Worked Days', base: 'Base', bonus: 'Bonus',
    deduction: 'Deduction', card: 'Card', pay_btn: 'Pay',
  }
};

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'uz');
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === 'true');

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('dark', dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  const t = (key) => LANGS[lang]?.[key] || LANGS['uz'][key] || key;

  return (
    <AppContext.Provider value={{ lang, setLang, dark, setDark, t }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
