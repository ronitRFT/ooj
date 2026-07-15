-- Enforce at most one event with status = 'active' at the DB level.
-- Run: mysql -u root -p ooj_events < backend/database/migration_single_active_event_guard.sql

USE ooj_events;

DROP TRIGGER IF EXISTS events_single_active_before_insert;
DROP TRIGGER IF EXISTS events_single_active_before_update;

DELIMITER //

CREATE TRIGGER events_single_active_before_insert
BEFORE INSERT ON events
FOR EACH ROW
BEGIN
  IF NEW.status = 'active' THEN
    IF (SELECT COUNT(*) FROM events WHERE status = 'active') > 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only one event can be active at a time';
    END IF;
  END IF;
END//

CREATE TRIGGER events_single_active_before_update
BEFORE UPDATE ON events
FOR EACH ROW
BEGIN
  IF NEW.status = 'active' AND OLD.status <> 'active' THEN
    IF (SELECT COUNT(*) FROM events WHERE status = 'active' AND id <> NEW.id) > 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only one event can be active at a time';
    END IF;
  END IF;
END//

DELIMITER ;
