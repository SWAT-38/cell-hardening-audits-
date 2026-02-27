// Supabase configuration - UPDATE THESE with your project values
// Find them at: https://supabase.com/dashboard → Project Settings → API
const SUPABASE_URL = 'https://nfcuwpwxndkpkittjgnt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cw-aNUl8Jw3FDkR5I5TSZQ_oC_S32ne';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Checklist definitions (single source of truth)
const CATEGORIES = [
  {
    id: 'safety', name: 'Safety', icon: '⚠️', critical: true,
    items: [
      { id: 'safety_caps_guards', label: 'All safety caps and guards installed' },
      { id: 'bump_stops_retract', label: 'Bump stops and retract bars functional' },
      { id: 'operator_pendants', label: 'Operator pendants functional on both sides' },
      { id: 'pinch_catch_points', label: 'No exposed pinch or catch points' },
      { id: 'transition_plates_lips', label: 'Transition plates free of hard lips' },
    ]
  },
  {
    id: 'sensors', name: 'Sensors & Data Integrity', icon: '📡', critical: true,
    items: [
      { id: 'sensors_plc_hmi', label: 'All sensors trigger correctly in PLC/HMI' },
      { id: 'sensor_flags_green', label: 'Correct sensor flags green on HMI' },
      { id: 'sick_banner_tuned', label: 'Sick GL6 / DT35 / Banner sensors tuned' },
      { id: 'sensors_1inch', label: 'Sensors positioned ~1 inch above conveyor where possible' },
      { id: 'distance_center', label: 'Distance sensors aimed at center of target plate' },
      { id: 'decel_stop_position', label: 'Decel and stop sensors positioned correctly' },
    ]
  },
  {
    id: 'conveyor_level', name: 'Conveyor Level & Transitions', icon: '🛤️', critical: false,
    items: [
      { id: 'level_end_to_end', label: 'Conveyors level end-to-end' },
      { id: 'smooth_transitions', label: 'Smooth transitions between conveyors' },
      { id: 'transfer_plates', label: 'Segmented transfer plates correct size and height' },
      { id: 'curve_aligned', label: 'Curve conveyors aligned with straights' },
    ]
  },
  {
    id: 'belts', name: 'Belts, Mat Tops & Tension', icon: '🔄', critical: false,
    items: [
      { id: 'belts_tension_tracking', label: 'Belts properly tensioned and tracking centered' },
      { id: 'mat_top_links', label: 'Mat-top links adjusted correctly' },
      { id: 'snugger_belts', label: 'Snugger belts within specified tension range' },
    ]
  },
  {
    id: 'bearings', name: 'Bearings & Mechanical Freedom', icon: '⚙️', critical: false,
    items: [
      { id: 'pulley_bearings', label: 'Pulley bearings rotate freely' },
      { id: 'turntable_binding', label: 'No binding under turntables' },
      { id: 'spacer_clearance', label: 'Spacers provide adequate clearance' },
    ]
  },
  {
    id: 'electrical', name: 'Electrical & Communication', icon: '⚡', critical: true,
    items: [
      { id: 'drives_sensors_secured', label: 'All drives, sensors, splitters, reflectors secured' },
      { id: 'no_loose_connections', label: 'No loose connections or cable strain' },
    ]
  },
  {
    id: 'speed', name: 'Conveyor Speed Validation', icon: '🏎️', critical: false,
    items: [
      { id: 'speed_tachometer', label: 'Speed verified with calibrated tachometer' },
      { id: 'speed_matches_hmi', label: 'Actual speed matches HMI' },
    ]
  },
  {
    id: 'guide_rails', name: 'Guide Rails & Case Control', icon: '🛤️', critical: false,
    items: [
      { id: 'rails_funnel_center', label: 'Guide rails funnel cases to center' },
      { id: 'no_wall_paddle_contact', label: 'No wall or paddle contact' },
      { id: 'rails_extend_centerers', label: 'Rails extend correctly into centerers and staging' },
    ]
  },
];

const TOTAL_ITEMS = CATEGORIES.reduce((sum, c) => sum + c.items.length, 0);

const DC_OPTIONS = [
  { value: '6006', label: '6006 \u2013 Cullman, AL' },
  { value: '6010', label: '6010 \u2013 Douglas, GA' },
  { value: '6011', label: '6011 \u2013 Brookhaven, MS' },
  { value: '6012', label: '6012 \u2013 Plainview, TX' },
  { value: '6016', label: '6016 \u2013 New Braunfels, TX' },
  { value: '6017', label: '6017 \u2013 Seymour, IN' },
  { value: '6018', label: '6018 \u2013 Searcy, AR' },
  { value: '6019', label: '6019 \u2013 Loveland, CO' },
  { value: '6020', label: '6020 \u2013 Brooksville, FL' },
  { value: '6021', label: '6021 \u2013 Porterville, CA' },
  { value: '6023', label: '6023 \u2013 Sutherland, VA' },
  { value: '6024', label: '6024 \u2013 Grove City, OH' },
  { value: '6025', label: '6025 \u2013 Menomonie, WI' },
  { value: '6026', label: '6026 \u2013 Red Bluff, CA' },
  { value: '6027', label: '6027 \u2013 Woodland, PA' },
  { value: '6030', label: '6030 \u2013 Raymond, NH' },
  { value: '6031', label: '6031 \u2013 Buckeye, AZ' },
  { value: '6035', label: '6035 \u2013 Ottawa, KS' },
  { value: '6036', label: '6036 \u2013 Palestine, TX' },
  { value: '6037', label: '6037 \u2013 Hermiston, OR' },
  { value: '6038', label: '6038 \u2013 Marcy, NY' },
  { value: '6039', label: '6039 \u2013 Midway, TN' },
  { value: '6040', label: '6040 \u2013 Hope Mills, NC' },
];

const CELL_OPTIONS = ['213', '214', '215', '216', '217', '218', '219'];
