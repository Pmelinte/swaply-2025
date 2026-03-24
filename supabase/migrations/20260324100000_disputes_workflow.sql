-- Full dispute workflow: disputes table + evidence table + RLS

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_id UUID REFERENCES swaps(id) ON DELETE CASCADE,
  initiator_id UUID REFERENCES auth.users(id),
  respondent_id UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open'
    CHECK (status IN (
      'open','waiting_evidence','under_review',
      'resolved_requester','resolved_responder',
      'resolved_split','rejected'
    )),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Evidence table
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES auth.users(id),
  evidence_type TEXT CHECK (evidence_type IN (
    'photo','chat_screenshot','tracking','meeting_code',
    'location_proof','note'
  )),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disputes_swap_id ON disputes(swap_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_initiator ON disputes(initiator_id);
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute ON dispute_evidence(dispute_id);

-- RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;

-- Participants + admins can view disputes
CREATE POLICY disputes_select ON disputes FOR SELECT USING (
  auth.uid() = initiator_id
  OR auth.uid() = respondent_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
);

-- Only participants can insert
CREATE POLICY disputes_insert ON disputes FOR INSERT WITH CHECK (
  auth.uid() = initiator_id
);

-- Only admins can update (resolve)
CREATE POLICY disputes_update ON disputes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
);

-- Evidence: participants can view
CREATE POLICY evidence_select ON dispute_evidence FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM disputes d
    WHERE d.id = dispute_id
    AND (d.initiator_id = auth.uid() OR d.respondent_id = auth.uid()
         OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator')))
  )
);

-- Evidence: participants can insert their own
CREATE POLICY evidence_insert ON dispute_evidence FOR INSERT WITH CHECK (
  auth.uid() = submitted_by
  AND EXISTS (
    SELECT 1 FROM disputes d
    WHERE d.id = dispute_id
    AND (d.initiator_id = auth.uid() OR d.respondent_id = auth.uid())
  )
);
