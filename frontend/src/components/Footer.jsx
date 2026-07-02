import { useActiveEvent } from '../context/ActiveEventContext';

export default function Footer() {
  const { copy } = useActiveEvent();

  return (
    <footer className="footer">
      <p className="footer-brand">{copy.brand_name}</p>
      <p>&copy; {new Date().getFullYear()} {copy.brand_name}. All rights reserved.</p>
    </footer>
  );
}
