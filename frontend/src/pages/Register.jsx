import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventAPI } from '../services/api';
import RegistrationForm from '../components/RegistrationForm';
import './Register.css';

export default function Register() {
  const [searchParams] = useSearchParams();
  const eventParam = searchParams.get('event');

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEvent = async () => {
      try {
        if (eventParam === 'active' || !eventParam) {
          const { data } = await eventAPI.getActive();
          setEvent(data.data);
        } else {
          const { data } = await eventAPI.getById(eventParam);
          setEvent(data.data);
        }
      } catch {
        setError('Unable to load event for registration');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventParam]);

  if (loading) {
    return <div className="page-center"><div className="loader">Loading...</div></div>;
  }

  if (error || !event) {
    return (
      <div className="page-center">
        <div className="error-box">{error || 'No event available for registration'}</div>
      </div>
    );
  }

  return (
    <div className="register-page page-center">
      <RegistrationForm event={event} />
    </div>
  );
}
