const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#nav-links');
menuButton.addEventListener('click', () => {
	const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
	menuButton.setAttribute('aria-expanded', String(!isOpen));
	menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
	navigation.classList.toggle('open', !isOpen);
});
navigation.addEventListener('click', (event) => {
	if (event.target.closest('a')) {
		navigation.classList.remove('open');
		menuButton.setAttribute('aria-expanded', 'false');
		menuButton.setAttribute('aria-label', 'Abrir menu');
	}
});

const nearbyButton = document.querySelector('#nearby-button');
const nearbyStatus = document.querySelector('#nearby-status');
const nearbyCount = document.querySelector('#nearby-count');
const unitList = document.querySelector('#unit-list');
const mapElement = document.querySelector('#health-map');
const heroVideo = document.querySelector('#hero-video');

if (heroVideo) {
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const syncHeroPlayback = () => {
		if (reducedMotion.matches) {
			heroVideo.pause();
			return;
		}
		heroVideo.play().catch(() => {});
	};

	syncHeroPlayback();
	reducedMotion.addEventListener('change', syncHeroPlayback);
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') heroVideo.pause();
		else syncHeroPlayback();
	});
}

const accessibilityToggle = document.querySelector('#accessibility-toggle');
const accessibilityPanel = document.querySelector('#accessibility-panel');
const accessibilityClose = document.querySelector('#accessibility-close');
const accessibilityStatus = document.querySelector('#accessibility-status');
const decreaseFontButton = document.querySelector('#decrease-font');
const increaseFontButton = document.querySelector('#increase-font');
const fontSizeValue = document.querySelector('#font-size-value');
const readPageButton = document.querySelector('#read-page');
const readSelectionButton = document.querySelector('#read-selection');
const pauseReadingButton = document.querySelector('#pause-reading');
const stopReadingButton = document.querySelector('#stop-reading');
const readingSpeed = document.querySelector('#reading-speed');
const readingSpeedValue = document.querySelector('#reading-speed-value');
const translateSelectionButton = document.querySelector('#translate-selection');
const translationLanguage = document.querySelector('#translation-language');
const translationResult = document.querySelector('#translation-result');
const openLibrasButton = document.querySelector('#open-libras');
let selectedPageText = '';
let speechText = '';
let speechOffset = 0;
let speechRunId = 0;
let speechActive = false;
let speechPaused = false;
let speechNeedsRestart = false;
let speechLabel = 'Leitura';

if (accessibilityToggle && accessibilityPanel && accessibilityClose) {
	let fontScale = 1;

	function updateFontScale() {
		document.documentElement.style.setProperty('--font-scale', fontScale);
		fontSizeValue.textContent = `${Math.round(fontScale * 100)}%`;
		decreaseFontButton.disabled = fontScale <= 0.8;
		increaseFontButton.disabled = fontScale >= 1.5;
	}

	function setAccessibilityPanelOpen(isOpen) {
		accessibilityPanel.hidden = !isOpen;
		accessibilityToggle.setAttribute('aria-expanded', String(isOpen));
		accessibilityToggle.setAttribute('aria-label', isOpen ? 'Fechar ferramentas de acessibilidade' : 'Abrir ferramentas de acessibilidade');
		if (isOpen) accessibilityClose.focus();
		else accessibilityToggle.focus();
	}

	accessibilityToggle.addEventListener('click', () => setAccessibilityPanelOpen(accessibilityPanel.hidden));
	accessibilityClose.addEventListener('click', () => setAccessibilityPanelOpen(false));
	updateFontScale();
	decreaseFontButton.addEventListener('click', () => {
		fontScale = Math.max(0.8, Math.round((fontScale - 0.1) * 10) / 10);
		updateFontScale();
	});
	increaseFontButton.addEventListener('click', () => {
		fontScale = Math.min(1.5, Math.round((fontScale + 0.1) * 10) / 10);
		updateFontScale();
	});
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !accessibilityPanel.hidden) setAccessibilityPanelOpen(false);
	});
	document.addEventListener('selectionchange', () => {
		const selection = window.getSelection();
		const text = selection?.toString().trim();
		if (text && !accessibilityPanel.contains(selection.anchorNode)) selectedPageText = text;
	});

	function updateSpeechControls() {
		pauseReadingButton.disabled = !speechActive;
		stopReadingButton.disabled = !speechActive;
		pauseReadingButton.textContent = speechPaused ? '▶ Continuar' : 'Ⅱ Pausar';
	}

	function speakFromOffset() {
		const startOffset = speechOffset;
		const runId = ++speechRunId;
		const utterance = new SpeechSynthesisUtterance(speechText.slice(startOffset));
		utterance.lang = 'pt-BR';
		utterance.rate = Number(readingSpeed.value);
		utterance.onstart = () => {
			if (runId !== speechRunId) return;
			speechPaused = false;
			updateSpeechControls();
			accessibilityStatus.textContent = `${speechLabel} iniciada.`;
		};
		utterance.onboundary = (event) => {
			if (runId === speechRunId && typeof event.charIndex === 'number') speechOffset = Math.min(speechText.length, startOffset + event.charIndex);
		};
		utterance.onend = () => {
			if (runId !== speechRunId) return;
			speechActive = false;
			speechPaused = false;
			speechNeedsRestart = false;
			speechOffset = 0;
			updateSpeechControls();
			accessibilityStatus.textContent = `${speechLabel} concluída.`;
		};
		utterance.onerror = () => {
			if (runId !== speechRunId) return;
			speechActive = false;
			speechPaused = false;
			updateSpeechControls();
			accessibilityStatus.textContent = 'Não foi possível continuar a leitura por voz.';
		};
		window.speechSynthesis.speak(utterance);
	}

	function startReading(text, label) {
		if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
			accessibilityStatus.textContent = 'A leitura por voz não é compatível com este navegador.';
			return;
		}
		if (!text) return;
		speechRunId += 1;
		window.speechSynthesis.cancel();
		speechText = text;
		speechOffset = 0;
		speechActive = true;
		speechPaused = false;
		speechNeedsRestart = false;
		speechLabel = label;
		updateSpeechControls();
		speakFromOffset();
	}

	readPageButton.addEventListener('click', () => startReading(document.querySelector('main')?.innerText.trim(), 'Leitura da página'));
	readSelectionButton.addEventListener('click', () => {
		if (!selectedPageText) {
			accessibilityStatus.textContent = 'Selecione um trecho da página antes de iniciar a leitura.';
			return;
		}
		startReading(selectedPageText, 'Leitura da seleção');
	});
	readingSpeed.addEventListener('input', () => {
		const speedLabel = `${readingSpeed.value.replace('.', ',')}×`;
		readingSpeedValue.textContent = speedLabel;
		readingSpeed.setAttribute('aria-valuetext', `${readingSpeed.value.replace('.', ',')} vezes`);
		if (!speechActive) return;
		const wasPaused = speechPaused;
		speechRunId += 1;
		window.speechSynthesis.cancel();
		if (wasPaused) {
			speechNeedsRestart = true;
			updateSpeechControls();
			accessibilityStatus.textContent = `Velocidade ajustada para ${speedLabel}. A leitura permanece pausada.`;
			return;
		}
		speechNeedsRestart = false;
		speechPaused = false;
		speakFromOffset();
	});

	pauseReadingButton.addEventListener('click', () => {
		if (speechPaused) {
			speechPaused = false;
			updateSpeechControls();
			if (speechNeedsRestart) {
				speechNeedsRestart = false;
				speakFromOffset();
			} else {
				window.speechSynthesis.resume();
				accessibilityStatus.textContent = 'Leitura retomada.';
			}
		} else if (speechActive && window.speechSynthesis.speaking) {
			speechPaused = true;
			window.speechSynthesis.pause();
			updateSpeechControls();
			accessibilityStatus.textContent = 'Leitura pausada.';
		}
	});

	stopReadingButton.addEventListener('click', () => {
		speechRunId += 1;
		window.speechSynthesis.cancel();
		speechActive = false;
		speechPaused = false;
		speechNeedsRestart = false;
		speechOffset = 0;
		updateSpeechControls();
		accessibilityStatus.textContent = 'Leitura interrompida.';
	});

	translateSelectionButton.addEventListener('click', async () => {
		if (!selectedPageText) {
			translationResult.textContent = 'Selecione primeiro um trecho de texto da página.';
			return;
		}
		if (selectedPageText.length > 4500) {
			translationResult.textContent = 'Selecione um trecho menor (até 4.500 caracteres).';
			return;
		}
		translateSelectionButton.disabled = true;
		translationResult.textContent = 'Traduzindo…';
		const params = new URLSearchParams({ q: selectedPageText, langpair: `pt|${translationLanguage.value}` });
		try {
			const response = await fetch(`https://api.mymemory.translated.net/get?${params}`);
			if (!response.ok) throw new Error(`MyMemory respondeu ${response.status}`);
			const data = await response.json();
			if (data.responseStatus !== 200 || !data.responseData?.translatedText) throw new Error('A tradução não está disponível.');
			translationResult.textContent = data.responseData.translatedText;
		} catch {
			translationResult.textContent = 'Não foi possível traduzir agora. Verifique a conexão e tente novamente.';
		} finally {
			translateSelectionButton.disabled = false;
		}
	});

	if (window.VLibras?.Widget) {
		new window.VLibras.Widget({ rootPath: 'https://vlibras.gov.br/app', position: 'R' });
		if (window.VLibrasWidget?.initBtn) window.VLibrasWidget.initBtn.style.display = 'none';
	}

	openLibrasButton.addEventListener('click', () => {
		const openVLibras = window.VLibrasWidget?.open;
		if (typeof openVLibras !== 'function') {
			accessibilityStatus.textContent = 'VLibras não carregou. Verifique a conexão e atualize a página.';
			return;
		}
		openVLibras();
		accessibilityStatus.textContent = 'VLibras ativado.';
	});
}

if (nearbyButton && nearbyStatus && nearbyCount && unitList && mapElement) {
	if (!window.L) {
		nearbyButton.disabled = true;
		nearbyStatus.textContent = 'Não foi possível carregar o mapa. Verifique sua conexão e atualize a página.';
	} else {
		const searchOrigin = { latitude: -19.8142089, longitude: -43.9622036 };
		const map = L.map(mapElement);
		map.setView([searchOrigin.latitude, searchOrigin.longitude], 13);
		const unitMarkers = L.layerGroup().addTo(map);
		const mapAccent = getComputedStyle(document.documentElement).getPropertyValue('--rose').trim();
		L.circle([searchOrigin.latitude, searchOrigin.longitude], { radius: 5000, color: mapAccent, fillColor: mapAccent, fillOpacity: 0.08, weight: 1 }).addTo(unitMarkers);
		L.circleMarker([searchOrigin.latitude, searchOrigin.longitude], { radius: 7, color: '#fff', weight: 3, fillColor: mapAccent, fillOpacity: 1 }).bindPopup('Venda Nova, Belo Horizonte').addTo(unitMarkers);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 19
		}).addTo(map);

		function formatDistance(distance) {
			return distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;
		}

		function distanceBetween(first, second) {
			const radians = (degrees) => degrees * Math.PI / 180;
			const latitudeDelta = radians(second.latitude - first.latitude);
			const longitudeDelta = radians(second.longitude - first.longitude);
			const arc = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
			return 6371000 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
		}

		function createUnitCard(unit) {
			const article = document.createElement('article');
			article.className = 'unit-card';
			const title = document.createElement('h4');
			title.textContent = unit.name;
			const type = document.createElement('p');
			type.textContent = unit.type;
			const address = document.createElement('p');
			address.className = 'unit-address';
			address.textContent = unit.address;
			const bottom = document.createElement('div');
			bottom.className = 'unit-card-bottom';
			const distance = document.createElement('span');
			distance.className = 'unit-distance';
			distance.textContent = formatDistance(unit.distance);
			const route = document.createElement('a');
			route.className = 'unit-route';
			route.href = `https://www.google.com/maps/dir/?api=1&destination=${unit.latitude},${unit.longitude}`;
			route.target = '_blank';
			route.rel = 'noreferrer';
			route.textContent = 'Traçar rota ↗';
			bottom.append(distance, route);
			article.append(title, type);
			if (unit.address) article.append(address);
			article.append(bottom);
			return article;
		}

		function showUnits(units, origin) {
			units.sort((first, second) => first.distance - second.distance);

			unitMarkers.clearLayers();
			L.circle([origin.latitude, origin.longitude], { radius: 5000, color: mapAccent, fillColor: mapAccent, fillOpacity: 0.08, weight: 1 }).addTo(unitMarkers);
			L.circleMarker([origin.latitude, origin.longitude], { radius: 7, color: '#fff', weight: 3, fillColor: mapAccent, fillOpacity: 1 }).bindPopup('Venda Nova, Belo Horizonte').addTo(unitMarkers);

			units.slice(0, 40).forEach((unit) => {
				const marker = L.marker([unit.latitude, unit.longitude], {
					icon: L.divIcon({ className: 'health-map-marker', html: '<span></span>', iconSize: [18, 18], iconAnchor: [9, 9] })
				});
				const popup = document.createElement('div');
				popup.className = 'map-popup';
				const title = document.createElement('h3');
				title.textContent = unit.name;
				const type = document.createElement('p');
				type.textContent = unit.type;
				const distance = document.createElement('span');
				distance.className = 'unit-distance';
				distance.textContent = formatDistance(unit.distance);
				popup.append(title, type, distance);
				marker.bindPopup(popup).addTo(unitMarkers);
			});

			nearbyCount.textContent = String(units.length);
			unitList.replaceChildren();
			if (units.length === 0) {
				const empty = document.createElement('p');
				empty.className = 'nearby-empty';
				empty.textContent = 'Nenhuma unidade mapeada neste raio. Tente novamente mais tarde ou consulte uma UBS da sua região.';
				unitList.append(empty);
				nearbyStatus.textContent = 'Nenhuma unidade foi encontrada em um raio de 5 km.';
			} else {
				units.slice(0, 30).forEach((unit) => unitList.append(createUnitCard(unit)));
				nearbyStatus.textContent = `Encontramos ${units.length} resultado${units.length === 1 ? '' : 's'} em um raio de 5 km. Os dados dependem do mapeamento colaborativo do OpenStreetMap.`;
			}
			map.setView([origin.latitude, origin.longitude], 14);
		}

		async function searchNearbyUnits(origin) {
			nearbyButton.disabled = true;
			nearbyStatus.textContent = 'Buscando unidades próximas no OpenStreetMap…';
			unitMarkers.clearLayers();
			L.circle([origin.latitude, origin.longitude], { radius: 5000, color: mapAccent, fillColor: mapAccent, fillOpacity: 0.08, weight: 1 }).addTo(unitMarkers);
			L.circleMarker([origin.latitude, origin.longitude], { radius: 7, color: '#fff', weight: 3, fillColor: mapAccent, fillOpacity: 1 }).bindPopup('Venda Nova, Belo Horizonte').addTo(unitMarkers);
			map.setView([origin.latitude, origin.longitude], 14);
			const searchTerms = ['UBS', 'posto de saúde', 'centro de saúde', 'hospital'];
			try {
				const responses = await Promise.allSettled(searchTerms.map(async (term) => {
					const params = new URLSearchParams({ q: term, lat: String(origin.latitude), lon: String(origin.longitude), limit: '25' });
					const controller = new AbortController();
					const timeout = window.setTimeout(() => controller.abort(), 12000);
					try {
						const response = await fetch(`https://photon.komoot.io/api/?${params}`, { signal: controller.signal });
						if (!response.ok) throw new Error(`Photon respondeu ${response.status}`);
						return await response.json();
					} finally {
						window.clearTimeout(timeout);
					}
				}));
				const features = responses.filter((result) => result.status === 'fulfilled').flatMap((result) => result.value.features || []);
				if (features.length === 0) throw new Error('Nenhuma fonte de dados respondeu.');

				const healthTypes = new Set(['clinic', 'doctors', 'doctor', 'hospital', 'health_post', 'centre', 'diagnostic', 'laboratory', 'yes']);
				const seenUnits = new Set();
				const typeLabels = { clinic: 'Clínica', doctors: 'Consultório médico', doctor: 'Consultório médico', hospital: 'Hospital', health_post: 'Posto de saúde', centre: 'Centro de saúde', diagnostic: 'Centro de diagnóstico', laboratory: 'Laboratório', yes: 'Unidade de saúde' };
				const units = features.map((feature) => {
					const properties = feature.properties || {};
					const [longitude, latitude] = feature.geometry?.coordinates || [];
					if (typeof latitude !== 'number' || typeof longitude !== 'number' || !['amenity', 'healthcare'].includes(properties.osm_key) || !healthTypes.has(properties.osm_value)) return null;
					const key = `${properties.osm_type || ''}/${properties.osm_id || `${latitude},${longitude}`}`;
					if (seenUnits.has(key)) return null;
					seenUnits.add(key);
					const distance = distanceBetween(origin, { latitude, longitude });
					if (distance > 5000) return null;
					const address = [properties.street, properties.housenumber, properties.district || properties.city].filter(Boolean).join(', ');
					return {
						latitude,
						longitude,
						name: properties.name || 'Unidade de saúde',
						type: typeLabels[properties.osm_value] || 'Unidade de saúde',
						address,
						distance
					};
				}).filter(Boolean);
				showUnits(units, origin);
			} catch (error) {
				nearbyStatus.textContent = error.name === 'AbortError'
					? 'A busca demorou demais. Tente novamente em alguns instantes.'
					: 'As fontes de dados estão indisponíveis agora. Verifique sua conexão e tente novamente.';
			} finally {
				nearbyButton.disabled = false;
			}
		}

		nearbyButton.addEventListener('click', () => searchNearbyUnits(searchOrigin));
	}
}
