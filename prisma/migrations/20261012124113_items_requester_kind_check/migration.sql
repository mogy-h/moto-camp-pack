ALTER TABLE items
  ADD CONSTRAINT items_requester_kind_check
  CHECK (
    (kind = 'RENTAL' AND requester_id IS NOT NULL) OR
    (kind = 'SHARED' AND requester_id IS NULL)
  );