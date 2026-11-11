import { Link, Route, Routes } from 'react-router-dom';
import { RequireRole } from './auth/RequireRole';
import { Layout } from './components/Layout';
import { Empty } from './components/ui';
import { Home } from './pages/Home';
import { SpecialistDetail } from './pages/SpecialistDetail';
import { Reviews } from './pages/Reviews';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Book } from './pages/Book';
import { MyAppointments } from './pages/MyAppointments';
import { Profile } from './pages/Profile';
import { SpecialistAppointments } from './pages/specialist/SpecialistAppointments';
import { WorkingHours } from './pages/specialist/WorkingHours';
import { SpecialistProfilePage } from './pages/specialist/SpecialistProfile';
import { AdminServices } from './pages/admin/AdminServices';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminSpecialists } from './pages/admin/AdminSpecialists';
import { AdminUsers } from './pages/admin/AdminUsers';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="book" element={<Book />} />
        <Route path="specialists/:id" element={<SpecialistDetail />} />
        <Route path="reviews" element={<Reviews />} />

        <Route element={<RequireRole />}>
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route element={<RequireRole roles={['CUSTOMER']} />}>
          <Route path="my-appointments" element={<MyAppointments />} />
        </Route>

        <Route element={<RequireRole roles={['SPECIALIST']} />}>
          <Route path="specialist/appointments" element={<SpecialistAppointments />} />
          <Route path="specialist/hours" element={<WorkingHours />} />
          <Route path="specialist/profile" element={<SpecialistProfilePage />} />
        </Route>

        <Route element={<RequireRole roles={['ADMIN']} />}>
          <Route path="admin/services" element={<AdminServices />} />
          <Route path="admin/categories" element={<AdminCategories />} />
          <Route path="admin/specialists" element={<AdminSpecialists />} />
          <Route path="admin/users" element={<AdminUsers />} />
        </Route>

        <Route
          path="*"
          element={
            <Empty title="صفحه پیدا نشد">
              <Link to="/">بازگشت به خانه</Link>
            </Empty>
          }
        />
      </Route>
    </Routes>
  );
}
