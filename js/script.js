const track = document.getElementById('servicesTrack');
  const dots = Array.from(document.querySelectorAll('#servicesDots .dot'));
  const cards = Array.from(document.querySelectorAll('.service-card'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
        const idx = entry.target.dataset.index;
        dots.forEach(d => d.classList.toggle('is-active', d.dataset.index === idx));
      }
    });
  }, { root: track, threshold: [0.6] });

  cards.forEach(card => observer.observe(card));

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const card = cards[Number(dot.dataset.index)];
      card.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
    });
  });

function toggleSideMenu(){
  const menu = document.getElementById('sideMenu');
  const backdrop = document.getElementById('sideMenuBackdrop');
  const isOpen = menu.classList.toggle('is-open');
  backdrop.classList.toggle('is-visible', isOpen);
  menu.setAttribute('aria-hidden', String(!isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

/* ---- Script Block ---- */

function alignCuidadosUnderlines(){
    document.querySelectorAll('.cuidado').forEach(function(card){
      var name = card.querySelector('.cuidado__name');
      var underline = card.querySelector('.cuidado__underline');
      if(!name || !underline) return;
      var nameRect = name.getBoundingClientRect();
      var parentRect = card.closest('.cuidados').getBoundingClientRect();
      var padding = 4; // pequeno respiro depois da última letra, em px
      underline.style.left = (nameRect.left - parentRect.left) + 'px';
      underline.style.width = (nameRect.width + padding) + 'px';
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(alignCuidadosUnderlines);
  } else {
    window.addEventListener('load', alignCuidadosUnderlines);
  }
  window.addEventListener('resize', alignCuidadosUnderlines);

  /* ---------- Efeito de chegada ao rolar ---------- */
  function setupCuidadosReveal(){
    var targets = document.querySelectorAll('.cuidados__reveal-group, .cuidado');

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function(el){ el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    targets.forEach(function(el){ observer.observe(el); });
  }

  setupCuidadosReveal();

/* ---- Script Block ---- */

const screens = ['booking-service', 'booking-calendar', 'booking-confirm', 'booking-success'];
  const labels = {
    'booking-service': '1. Serviço',
    'booking-calendar': '2. Data/Hora',
    'booking-confirm': '3. Resumo',
    'booking-success': '4. Confirmado'
  };

  const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  let state = { service: null, price: null, dateObj: null, time: null, duration: 1, complementos: [], confirmed: false };
  let calState = { year: null, month: null };

  function renderDevNav() {
    const nav = document.getElementById('devNav');
    nav.innerHTML = screens.map(s => `<span class="${getCurrent()===s?'current':''}" onclick="goTo('${s}')">${labels[s]}</span>`).join('');
  }

  function getCurrent() {
    return screens.find(s => document.getElementById('screen-'+s).classList.contains('active'));
  }

  function goTo(screenId) {
    const currentId = getCurrent();
    const currentIndex = screens.indexOf(currentId);
    const targetIndex = screens.indexOf(screenId);
    if (targetIndex < 0) return;

    // Não permite pular etapas: cada avanço exige os dados da etapa anterior.
    if (targetIndex > currentIndex) {
      if (screenId === 'booking-calendar' && !state.service) return;
      if (screenId === 'booking-confirm' && (!state.service || !state.dateObj || !state.time)) return;
      if (screenId === 'booking-success' && !state.confirmed) return;
    }

    screens.forEach(s => document.getElementById('screen-'+s).classList.remove('active'));
    document.getElementById('screen-'+screenId).classList.add('active');
    window.scrollTo(0,0);
    renderDevNav();
  }

  function selectService(el) {
    document.querySelectorAll('.bk-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    state.service = el.dataset.service;
    state.price = el.dataset.price;
    state.duration = parseInt(el.dataset.duration || '1', 10);

    const btn1 = document.getElementById('continueBtn1');
    if (el.dataset.whatsappOnly === 'true') {
      btn1.textContent = 'Chamar no WhatsApp';
      btn1.onclick = () => alert('Abriria o WhatsApp diretamente para agendar o Horário Exclusivo');
      btn1.style.background = 'var(--marrom)';
      btn1.style.color = 'var(--bg)';
    } else {
      btn1.textContent = 'Continuar';
      btn1.onclick = () => openComplementos();
      btn1.style.background = '';
      btn1.style.color = '';
    }
    btn1.disabled = false;
    btn1.style.opacity = '1';
    btn1.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ---------- Complementos (regras condicionais por serviço) ----------
  // 'corte' cobre Cabelo, Cabelo + Barba | 'barba' cobre Barba, Cabelo + Barba
  const SERVICE_COMPONENTS = {
    'Cabelo': ['corte'],
    'Barba': ['barba'],
    'Cabelo + Barba': ['corte', 'barba']
  };

  const COMPLEMENTS = [
    { id: 'hidratacao', name: 'Hidratação Capilar', meta: 'Após a lavagem padrão do corte', requires: 'corte', price: 'R$ 30' },
    { id: 'sobrancelha', name: 'Design de Sobrancelha', meta: 'Definição precisa com navalha', requires: null, price: 'R$ 30' },
    { id: 'revitalizacao', name: 'Revitalização Facial', meta: 'Durante a preparação da barba', requires: 'barba', price: 'R$ 30' },
    { id: 'contorno', name: 'Contorno de Barba', meta: 'Acabamento com navalha', requires: 'corte', price: 'R$ 35' }
  ];

  function complementsTotal() {
    return state.complementos
      .map(id => COMPLEMENTS.find(c => c.id === id))
      .filter(Boolean)
      .reduce((sum, c) => sum + (c.price ? parseInt(c.price.replace(/\D/g, ''), 10) : 0), 0);
  }

  function updateComplementosBtnLabel() {
    const total = complementsTotal();
    document.getElementById('continueComplementosBtn').textContent = total > 0
      ? `Continuar · R$ ${total}`
      : 'Continuar sem complementos';
  }

  function openComplementos() {
    if (!state.service) return;
    renderComplementos();
    updateComplementosBtnLabel();
    document.getElementById('complementosBackdrop').classList.add('active');
    document.getElementById('screen-booking-service').classList.add('blurred');
  }

  function closeComplementos() {
    document.getElementById('complementosBackdrop').classList.remove('active');
    document.getElementById('screen-booking-service').classList.remove('blurred');
  }

  function renderComplementos() {
    const list = document.getElementById('complementosList');
    list.innerHTML = '';
    const components = SERVICE_COMPONENTS[state.service] || [];
    const available = COMPLEMENTS.filter(c => !c.requires || components.includes(c.requires));

    if (available.length === 0) {
      list.innerHTML = '<div class="complement-empty">Nenhum complemento disponível para este serviço.</div>';
      return;
    }

    available.forEach(c => {
      const card = document.createElement('div');
      card.className = 'bk-card complement-card';
      if (state.complementos.includes(c.id)) card.classList.add('selected');
      card.innerHTML = `
        <div>
          <div class="name">${c.name}</div>
          <div class="meta">${c.meta}</div>
        </div>
        <div class="price">${c.price || 'A definir'}</div>`;
      card.onclick = () => toggleComplemento(c.id, card);
      list.appendChild(card);
    });
  }

  function toggleComplemento(id, card) {
    const idx = state.complementos.indexOf(id);
    if (idx >= 0) {
      state.complementos.splice(idx, 1);
      card.classList.remove('selected');
    } else {
      state.complementos.push(id);
      card.classList.add('selected');
    }
    const btn = document.getElementById('continueComplementosBtn');
    updateComplementosBtnLabel();
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function complementNames() {
    return state.complementos
      .map(id => COMPLEMENTS.find(c => c.id === id))
      .filter(Boolean)
      .map(c => c.name);
  }

  // ---------- Calendar (horários reais de funcionamento) ----------
  // Segunda a sexta: 10h-20h, pausa 12h-15h | Sábado: 8h-15h, sem pausa | Domingo: fechado
  function getWindowsForDow(dow) {
    if (dow === 6) return [[8, 15]];               // sábado, sem pausa
    if (dow >= 1 && dow <= 5) return [[10, 12], [15, 20]]; // seg-sex, com pausa 12h-15h
    return []; // domingo fechado
  }

  function getBrazilNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date()).reduce((out, p) => (out[p.type] = p.value, out), {});
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
  }

  function getDateKey(dateObj) {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
  }

  function getSlotsForDate(dateObj, duration) {
    duration = duration || 1;
    const windows = getWindowsForDow(dateObj.getDay());
    const slots = [];
    const brazilNow = getBrazilNow();
    const dateKey = getDateKey(dateObj);
    windows.forEach(([start, end]) => {
      for (let h = start; h + duration <= end; h++) {
        const slot = String(h).padStart(2, '0') + ':00';
        if (dateKey !== brazilNow.date || slot > brazilNow.time) slots.push(slot);
      }
    });
    return slots;
  }

  function renderCalendar() {
    const grid = document.getElementById('calGrid');
    grid.querySelectorAll('.cal-day').forEach(el => el.remove());

    const year = calState.year, month = calState.month;
    document.getElementById('calLabel').textContent = `${MONTH_NAMES[month]} ${year}`;

    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const brazilToday = getBrazilNow().date;
    const today = new Date(`${brazilToday}T00:00:00`);

    for (let i = 0; i < firstDow; i++) {
      const blank = document.createElement('div');
      blank.className = 'cal-day disabled';
      grid.appendChild(blank);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dow = dateObj.getDay();
      const cell = document.createElement('div');
      cell.textContent = d;
      // O atendimento começa a partir de amanhã; o dia atual não é exibido como disponível.
      const isPast = dateObj <= today;
      const isSunday = dow === 0;
      if (isPast || isSunday) {
        cell.className = 'cal-day disabled';
      } else {
        cell.className = 'cal-day available';
        cell.onclick = () => selectDay(cell, dateObj);
      }
      grid.appendChild(cell);
    }

    const prevBtn = document.getElementById('prevMonthBtn');
    if (year === today.getFullYear() && month === today.getMonth()) {
      prevBtn.classList.add('disabled');
    } else {
      prevBtn.classList.remove('disabled');
    }
  }

  function changeMonth(delta) {
    const today = new Date(`${getBrazilNow().date}T00:00:00`);
    let m = calState.month + delta;
    let y = calState.year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    if (y < today.getFullYear() || (y === today.getFullYear() && m < today.getMonth())) return;

    calState.month = m;
    calState.year = y;
    renderCalendar();

    // Trocar de mês reseta o horário selecionado
    state.dateObj = null;
    state.time = null;
    document.getElementById('timeGrid').innerHTML = '';
    document.getElementById('timeLabel').textContent = 'Selecione um dia para ver os horários';
    document.getElementById('continueBtn2').disabled = true;
    document.getElementById('continueBtn2').style.opacity = '0.4';
  }

  function selectDay(el, dateObj) {
    document.querySelectorAll('.cal-day.available').forEach(d => d.classList.remove('selected'));
    el.classList.add('selected');
    state.dateObj = dateObj;
    state.time = null;
    renderTimeSlots(dateObj);
    checkStep2();
    document.getElementById('timeGrid').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function renderTimeSlots(dateObj) {
    const slots = getSlotsForDate(dateObj, state.duration);
    const timeGrid = document.getElementById('timeGrid');
    timeGrid.innerHTML = '<div class="availability-loading" role="status" aria-live="polite"><span class="availability-spinner"></span><span>Carregando horários...</span></div>';
    document.getElementById('timeLabel').textContent = 'Consultando disponibilidade';
    let booked = [];
    try {
      const response = await fetch(`${BOOKING_API_URL.replace(/\/bookings$/, '/availability')}?date=${encodeURIComponent(getDateKey(dateObj))}`);
      if (response.ok) booked = (await response.json()).booked || [];
    } catch (error) { console.error('Falha ao consultar disponibilidade:', error); }
    // Horários reservados não são exibidos para o cliente.
    const availableSlots = slots.filter(t => !booked.includes(t));
    document.getElementById('timeLabel').textContent = availableSlots.length ? 'Horários disponíveis' : 'Sem horários disponíveis neste dia';
    availableSlots.forEach(t => {
      const el = document.createElement('div');
      el.className = 'time-slot';
      el.textContent = t;
      el.onclick = () => selectTime(el, t);
      timeGrid.appendChild(el);
    });
  }

  function selectTime(el, t) {
    document.querySelectorAll('.time-slot').forEach(x => x.classList.remove('selected'));
    el.classList.add('selected');
    state.time = t;
    checkStep2();
    document.getElementById('continueBtn2').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function checkStep2() {
    if (state.dateObj && state.time) {
      document.getElementById('continueBtn2').disabled = false;
      document.getElementById('continueBtn2').style.opacity = '1';
    }
  }

  // Watch when entering calendar/confirm screens to update texts
  const flowScreenObserver = new MutationObserver(() => {
    if (getCurrent() === 'booking-calendar') {
      document.getElementById('serviceConfirmText').textContent = `Horários disponíveis para ${state.service || 'o serviço'}.`;
    }
    if (getCurrent() === 'booking-confirm') {
      document.getElementById('sumService').textContent = state.service || '—';
      const names = complementNames();
      document.getElementById('sumComplementos').textContent = names.length ? names.join(', ') : 'Nenhum';
      document.getElementById('sumDate').textContent = state.dateObj
        ? `${state.dateObj.getDate()} de ${MONTH_NAMES[state.dateObj.getMonth()].toLowerCase()}, ${state.dateObj.getFullYear()}`
        : '—';
      document.getElementById('sumTime').textContent = state.time || '—';
      document.getElementById('sumPrice').textContent = state.price
        ? `R$ ${parseInt(state.price.replace(/\D/g, ''), 10) + complementsTotal()}`
        : '—';
    }
  });
  flowScreenObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

  // Endpoint HTTP API Gateway/Lambda. Será preenchido após a infraestrutura AWS ser criada.
  const BOOKING_API_URL = window.BOOKING_API_URL || 'https://qmflo59tuj.execute-api.us-east-1.amazonaws.com/bookings';

  async function confirmBooking() {
    if (!state.service || !state.dateObj || !state.time) return;
    if (!BOOKING_API_URL) {
      alert('O gateway de agendamento ainda não foi configurado.');
      return;
    }

    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    if (!customerName || !customerPhone) {
      alert('Informe seu nome e WhatsApp para confirmar o agendamento.');
      return;
    }
    const payload = {
      service: state.service,
      customerName,
      customerPhone,
      price: state.price,
      duration: state.duration,
      date: state.dateObj.toISOString().slice(0, 10),
      time: state.time,
      complementos: state.complementos.map(id => {
        const item = COMPLEMENTS.find(c => c.id === id);
        return item ? { id: item.id, name: item.name, price: item.price } : null;
      }).filter(Boolean),
      total: parseInt(state.price.replace(/\D/g, ''), 10) + complementsTotal(),
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch(BOOKING_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('gateway returned ' + response.status);
      state.confirmed = true;
      goTo('booking-success');
    } catch (error) {
      console.error('Falha ao enviar agendamento:', error);
      alert('Não foi possível enviar o agendamento. Tente novamente.');
    }
  }

  function resetAndGoHero() {
    state = { service: null, price: null, dateObj: null, time: null, duration: 1, complementos: [], confirmed: false };
    const today = new Date();
    calState = { year: today.getFullYear(), month: today.getMonth() };
    document.querySelectorAll('.bk-card').forEach(c => c.classList.remove('selected'));
    closeComplementos();
    document.getElementById('timeGrid').innerHTML = '';
    document.getElementById('timeLabel').textContent = 'Selecione um dia para ver os horários';
    document.getElementById('continueBtn1').disabled = true;
    document.getElementById('continueBtn1').style.opacity = '0.4';
    document.getElementById('continueBtn1').textContent = 'Continuar';
    document.getElementById('continueBtn1').onclick = () => openComplementos();
    document.getElementById('continueBtn2').disabled = true;
    document.getElementById('continueBtn2').style.opacity = '0.4';
    renderCalendar();
    // Esta página é o fluxo standalone; voltar ao início precisa retornar à LP.
    if (window.location.pathname.includes('/pages/')) {
      window.location.href = '../index.html';
    } else {
      closeBookingFlow();
    }
  }

  function openBookingFlow(preselectService) {
    document.getElementById('booking-flow-root').style.display = 'block';
    document.body.style.overflow = 'hidden';
    goTo('booking-service');
    window.scrollTo(0, 0);
    if (preselectService) {
      const card = document.querySelector('#screen-booking-service .bk-card[data-service="' + preselectService + '"]');
      if (card) selectService(card);
    }
  }

  function closeBookingFlow() {
    document.getElementById('booking-flow-root').style.display = 'none';
    document.body.style.overflow = '';
  }

  // init
  document.getElementById('continueBtn1').style.opacity = '0.4';
  document.getElementById('continueBtn2').style.opacity = '0.4';
  const todayInit = new Date(`${getBrazilNow().date}T00:00:00`);
  calState = { year: todayInit.getFullYear(), month: todayInit.getMonth() };
  renderCalendar();
  renderDevNav();