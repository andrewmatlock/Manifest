/* Manifest Color Picker */

function initializeColorpickerPlugin() {

    // ---- Parse any CSS color string via the browser ----

    const parseCtx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });

    function parseCssColor(str) {
        if (!str || typeof str !== 'string') return null;
        str = str.trim();
        if (!str) return null;
        const hex8 = str.match(/^#([0-9a-f]{8})$/i);
        if (hex8) {
            const n = parseInt(hex8[1], 16);
            return { r: (n >> 24) & 255, g: (n >> 16) & 255, b: (n >> 8) & 255, a: (n & 255) / 255 };
        }
        const hex4 = str.match(/^#([0-9a-f]{4})$/i);
        if (hex4) {
            const c = hex4[1];
            return { r: parseInt(c[0]+c[0],16), g: parseInt(c[1]+c[1],16), b: parseInt(c[2]+c[2],16), a: parseInt(c[3]+c[3],16)/255 };
        }
        parseCtx.clearRect(0, 0, 1, 1);
        parseCtx.fillStyle = '#00000000';
        parseCtx.fillStyle = str;
        if (parseCtx.fillStyle === '#00000000' && str !== '#00000000' && str !== 'transparent') {
            parseCtx.fillStyle = '#01010101';
            parseCtx.fillStyle = str;
            if (parseCtx.fillStyle === '#01010101') return null;
        }
        parseCtx.fillRect(0, 0, 1, 1);
        const d = parseCtx.getImageData(0, 0, 1, 1).data;
        return { r: d[0], g: d[1], b: d[2], a: +(d[3] / 255).toFixed(3) };
    }

    // ---- Color conversions ----

    function rgbToHex(r, g, b) { return '#' + [r,g,b].map(v => Math.round(v).toString(16).padStart(2,'0')).join(''); }
    function rgbToHex8(r, g, b, a) { return '#' + [r,g,b,Math.round(a*255)].map(v => Math.round(v).toString(16).padStart(2,'0')).join(''); }

    function rgbToHsv(r, g, b) {
        r/=255; g/=255; b/=255;
        const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
        let h=0, s=max===0?0:d/max, v=max;
        if(d!==0){ if(max===r)h=((g-b)/d+(g<b?6:0))/6; else if(max===g)h=((b-r)/d+2)/6; else h=((r-g)/d+4)/6; }
        return {h:h*360, s:s*100, v:v*100};
    }

    function hsvToRgb(h, s, v) {
        h/=360; s/=100; v/=100;
        let r,g,b; const i=Math.floor(h*6), f=h*6-i, p=v*(1-s), q=v*(1-f*s), t=v*(1-(1-f)*s);
        switch(i%6){ case 0:r=v;g=t;b=p;break; case 1:r=q;g=v;b=p;break; case 2:r=p;g=v;b=t;break; case 3:r=p;g=q;b=v;break; case 4:r=t;g=p;b=v;break; case 5:r=v;g=p;b=q;break; }
        return {r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255)};
    }

    function rgbToHsl(r, g, b) {
        r/=255; g/=255; b/=255;
        const max=Math.max(r,g,b), min=Math.min(r,g,b), l=(max+min)/2;
        let h=0, s=0;
        if(max!==min){ const d=max-min; s=l>0.5?d/(2-max-min):d/(max+min); if(max===r)h=((g-b)/d+(g<b?6:0))/6; else if(max===g)h=((b-r)/d+2)/6; else h=((r-g)/d+4)/6; }
        return {h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100)};
    }

    function srgbToLinear(c){ return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4); }
    function linearToSrgb(c){ return c<=0.0031308?12.92*c:1.055*Math.pow(c,1/2.4)-0.055; }

    function rgbToOklch(r, g, b) {
        const lr=srgbToLinear(r/255), lg=srgbToLinear(g/255), lb=srgbToLinear(b/255);
        const l_=0.4122214708*lr+0.5363325363*lg+0.0514459929*lb, m_=0.2119034982*lr+0.6806995451*lg+0.1073969566*lb, s_=0.0883024619*lr+0.2817188376*lg+0.6299787005*lb;
        const l1=Math.cbrt(l_), m1=Math.cbrt(m_), s1=Math.cbrt(s_);
        const L=0.2104542553*l1+0.7936177850*m1-0.0040720468*s1, a=1.9779984951*l1-2.4285922050*m1+0.4505937099*s1, bk=0.0259040371*l1+0.7827717662*m1-0.8086757660*s1;
        let H=Math.atan2(bk,a)*180/Math.PI; if(H<0)H+=360;
        return {l:+(L*100).toFixed(2), c:+Math.sqrt(a*a+bk*bk).toFixed(4), h:+H.toFixed(1)};
    }

    // ---- Format output ----

    const FORMATS = ['hex', 'rgb', 'hsl', 'oklch'];

    function formatColor(r, g, b, a, mode) {
        const hasA = a < 1;
        switch (mode) {
            case 'hex': return hasA ? rgbToHex8(r,g,b,a) : rgbToHex(r,g,b);
            case 'rgb': return `rgb(${r} ${g} ${b}${hasA?' / '+roundA(a):''})`;
            case 'hsl': { const c=rgbToHsl(r,g,b); return `hsl(${c.h} ${c.s}% ${c.l}%${hasA?' / '+roundA(a):''})`; }
            case 'oklch': { const c=rgbToOklch(r,g,b); return `oklch(${c.l}% ${c.c} ${c.h}${hasA?' / '+roundA(a):''})`; }
            default: return rgbToHex(r,g,b);
        }
    }

    function roundA(a) { const v=Math.round(a*100); return v===100?'1':(v/100).toString(); }

    function detectFormat(str) {
        str = str.trim().toLowerCase();
        if (str.startsWith('#')) return 'hex';
        if (str.startsWith('rgb')) return 'rgb';
        if (str.startsWith('hsl')) return 'hsl';
        if (str.startsWith('oklch')) return 'oklch';
        return null;
    }

    function colorToRgba(col) {
        const {r,g,b} = hsvToRgb(col.h, col.s, col.v);
        return col.a < 1 ? `rgba(${r},${g},${b},${col.a})` : rgbToHex(r,g,b);
    }

    // ---- Canvas ----

    function drawSvCanvas(canvas, hue) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const w = canvas.width, h = canvas.height;
        const hr = hsvToRgb(hue, 100, 100);
        const hG = ctx.createLinearGradient(0,0,w,0);
        hG.addColorStop(0,'#fff'); hG.addColorStop(1,`rgb(${hr.r},${hr.g},${hr.b})`);
        ctx.fillStyle = hG; ctx.fillRect(0,0,w,h);
        const vG = ctx.createLinearGradient(0,0,0,h);
        vG.addColorStop(0,'rgba(0,0,0,0)'); vG.addColorStop(1,'#000');
        ctx.fillStyle = vG; ctx.fillRect(0,0,w,h);
    }

    // ---- Gradient string builders ----

    const GRADIENT_TYPES = ['linear', 'radial', 'conic'];

    function buildLayerString(layer) {
        const stops = layer.stops.slice().sort((a,b) => a.position - b.position)
            .map(s => `${colorToRgba(s.color)} ${s.position}%`).join(', ');
        switch (layer.type) {
            case 'linear': return `linear-gradient(${layer.angle}deg, ${stops})`;
            case 'radial': return `radial-gradient(circle at ${layer.position.x}% ${layer.position.y}%, ${stops})`;
            case 'conic':  return `conic-gradient(from ${layer.angle}deg at ${layer.position.x}% ${layer.position.y}%, ${stops})`;
            default: return `linear-gradient(${layer.angle}deg, ${stops})`;
        }
    }

    function buildFullGradientString(layers) {
        return layers.map(buildLayerString).join(', ');
    }

    // ---- Helpers ----

    let anchorCounter = 0;
    function getAnchorCode() { return 'cp-' + (++anchorCounter); }

    function makeDefaultLayer() {
        return {
            type: 'linear', angle: 90, position: { x: 50, y: 50 },
            stops: [
                { color: { h: 0, s: 100, v: 100, a: 1 }, position: 0 },
                { color: { h: 240, s: 100, v: 100, a: 1 }, position: 100 }
            ]
        };
    }

    // ---- Plugin state ----

    function createPickerState(el, triggerBtn) {
        // el = the x-colorpicker element (menu, div, etc.)
        // triggerBtn = the x-dropdown trigger button (nullable, for swatch sync)
        const hiddenInput = el.querySelector('input[type=color], input[type=hidden]');

        const state = {
            el,
            triggerBtn,
            hiddenInput,
            solidColor: { h: 0, s: 0, v: 100, a: 1 },
            layers: [ makeDefaultLayer() ],
            activeLayerIndex: 0,
            activeStopIndex: 0,
            pickerMode: 'solid',
            mode: 'hex',

            // Element refs (inside el)
            canvas: el.querySelector('canvas'),
            hueSlider: el.querySelector('input[type=range].hue'),
            alphaSlider: el.querySelector('input[type=range].alpha'),
            colorInput: el.querySelector('.color-value') || el.querySelector('[role=group] input[type=text]'),
            alphaInput: el.querySelector('input.alpha-value'),
            eyedropperBtn: el.querySelector('.eyedropper'),
            layersContainer: el.querySelector('.gradient-layers'),
            reticle: null,

            // ---- Active color proxy ----

            activeLayer() { return this.layers[this.activeLayerIndex] || this.layers[0]; },
            activeStop() {
                const layer = this.activeLayer();
                return layer.stops[this.activeStopIndex] || layer.stops[0];
            },

            get h() { return this.isGradient() ? this.activeStop().color.h : this.solidColor.h; },
            set h(v) { if (this.isGradient()) this.activeStop().color.h = v; else this.solidColor.h = v; },
            get s() { return this.isGradient() ? this.activeStop().color.s : this.solidColor.s; },
            set s(v) { if (this.isGradient()) this.activeStop().color.s = v; else this.solidColor.s = v; },
            get v() { return this.isGradient() ? this.activeStop().color.v : this.solidColor.v; },
            set v(val) { if (this.isGradient()) this.activeStop().color.v = val; else this.solidColor.v = val; },
            get a() { return this.isGradient() ? this.activeStop().color.a : this.solidColor.a; },
            set a(v) { if (this.isGradient()) this.activeStop().color.a = v; else this.solidColor.a = v; },

            isGradient() { return this.pickerMode === 'gradient'; },

            setFromString(str) {
                const parsed = parseCssColor(str);
                if (!parsed) return false;
                const hsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
                this.h = hsv.h; this.s = hsv.s; this.v = hsv.v; this.a = parsed.a;
                const fmt = detectFormat(str);
                if (fmt) this.mode = fmt;
                return true;
            },

            selectStop(layerIndex, stopIndex) {
                this.activeLayerIndex = layerIndex;
                this.activeStopIndex = stopIndex;
                this.syncUI();
            },

            // ---- Layer management ----

            addLayer() {
                this.layers.push(makeDefaultLayer());
                this.activeLayerIndex = this.layers.length - 1;
                this.activeStopIndex = 0;
                this.renderLayers(); this.syncUI(); this.syncToInput();
            },

            duplicateLayer(index) {
                const src = this.layers[index];
                this.layers.splice(index + 1, 0, {
                    type: src.type, angle: src.angle, position: { ...src.position },
                    stops: src.stops.map(s => ({ color: { ...s.color }, position: s.position }))
                });
                this.activeLayerIndex = index + 1;
                this.activeStopIndex = 0;
                this.renderLayers(); this.syncUI(); this.syncToInput();
            },

            removeLayer(index) {
                if (this.layers.length <= 1) return;
                this.layers.splice(index, 1);
                if (this.activeLayerIndex >= this.layers.length) this.activeLayerIndex = this.layers.length - 1;
                this.activeStopIndex = 0;
                this.renderLayers(); this.syncUI(); this.syncToInput();
            },

            // ---- Stop management ----

            addStopToLayer(layerIndex, position) {
                const layer = this.layers[layerIndex];
                const sorted = layer.stops.slice().sort((a,b) => a.position - b.position);
                let before = sorted[0], after = sorted[sorted.length - 1];
                for (let i = 0; i < sorted.length - 1; i++) {
                    if (sorted[i].position <= position && sorted[i+1].position >= position) {
                        before = sorted[i]; after = sorted[i+1]; break;
                    }
                }
                const range = after.position - before.position;
                const t = range === 0 ? 0.5 : (position - before.position) / range;
                layer.stops.push({ color: {
                    h: before.color.h + (after.color.h - before.color.h) * t,
                    s: before.color.s + (after.color.s - before.color.s) * t,
                    v: before.color.v + (after.color.v - before.color.v) * t,
                    a: before.color.a + (after.color.a - before.color.a) * t,
                }, position });
                this.activeLayerIndex = layerIndex;
                this.activeStopIndex = layer.stops.length - 1;
                this.renderLayers(); this.syncUI(); this.syncToInput();
            },

            removeStopFromLayer(layerIndex, stopIndex) {
                const layer = this.layers[layerIndex];
                if (layer.stops.length <= 2) return;
                layer.stops.splice(stopIndex, 1);
                if (this.activeLayerIndex === layerIndex && this.activeStopIndex >= layer.stops.length)
                    this.activeStopIndex = layer.stops.length - 1;
                this.renderLayers(); this.syncUI(); this.syncToInput();
            },

            duplicateStop(layerIndex, stopIndex) {
                const layer = this.layers[layerIndex];
                const src = layer.stops[stopIndex];
                layer.stops.push({ color: { ...src.color }, position: Math.min(100, src.position + 5) });
                this.activeLayerIndex = layerIndex;
                this.activeStopIndex = layer.stops.length - 1;
                this.renderLayers(); this.syncUI(); this.syncToInput();
            },

            flipLayer(li) {
                for (const s of this.layers[li].stops) s.position = 100 - s.position;
                this.renderLayers(); this.syncToInput(); this.updateColorInput();
            },

            rotateLayer(li) {
                this.layers[li].angle = (this.layers[li].angle + 90) % 360;
                this.renderLayers(); this.syncToInput(); this.updateColorInput();
            },

            // ---- Conversions ----

            toRgb() { return hsvToRgb(this.h, this.s, this.v); },
            toHex() { const {r,g,b} = this.toRgb(); return rgbToHex(r,g,b); },

            toFormattedString() {
                if (this.isGradient()) return buildFullGradientString(this.layers);
                const {r,g,b} = this.toRgb();
                return formatColor(r, g, b, this.a, this.mode);
            },

            toSwatchColor() {
                if (this.isGradient()) return buildFullGradientString(this.layers);
                const {r,g,b} = this.toRgb();
                if (this.a < 1) return `rgba(${r},${g},${b},${this.a})`;
                return this.toHex();
            },

            // ---- Sync ----

            syncToInput() {
                const swatchVal = this.toSwatchColor();
                // Update hidden input for form participation
                if (this.hiddenInput) {
                    this.hiddenInput.value = this.toHex();
                    this.hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
                    this.hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
                // Update trigger button swatch
                if (this.triggerBtn) {
                    this.triggerBtn.style.setProperty('--swatch-color', swatchVal);
                }
            },

            syncUI() {
                this.drawCanvas();
                this.updateSliders();
                this.updateColorInput();
                this.updateAlphaInput();
                this.updateCanvasMarker();
            },

            drawCanvas() {
                if (!this.canvas) return;
                const rect = this.canvas.getBoundingClientRect();
                if (rect.width > 0) { this.canvas.width = rect.width; this.canvas.height = rect.height; }
                drawSvCanvas(this.canvas, this.h);
            },

            updateSliders() {
                if (this.hueSlider) this.hueSlider.value = this.h;
                if (this.alphaSlider) {
                    this.alphaSlider.value = Math.round(this.a * 100);
                    const {r,g,b} = this.toRgb();
                    this.alphaSlider.style.setProperty('--cp-color', `rgb(${r},${g},${b})`);
                }
            },

            updateCanvasMarker() {
                if (!this.reticle) return;
                this.reticle.style.left = this.s + '%';
                this.reticle.style.top = (100 - this.v) + '%';
            },

            updateColorInput() {
                if (!this.colorInput) return;
                if (document.activeElement !== this.colorInput) this.colorInput.value = this.toFormattedString();
                const sel = el.querySelector('.color-format');
                if (sel && sel.value !== this.mode) sel.value = this.mode;
            },

            updateAlphaInput() {
                if (!this.alphaInput) return;
                if (document.activeElement !== this.alphaInput) this.alphaInput.value = Math.round(this.a * 100);
            },

            // ---- Render gradient layers from <template> ----

            renderLayers() {
                if (!this.layersContainer) return;
                const template = el.querySelector('template.gradient-layer');
                if (!template) return;

                this.layersContainer.innerHTML = '';

                this.layers.forEach((layer, li) => {
                    const clone = template.content.cloneNode(true);
                    const root = clone.firstElementChild || clone.children[0];
                    if (!root) return;

                    const uid = 'cp-layer-' + anchorCounter + '-' + li;

                    // ---- Type dropdown ----
                    const typeBtn = root.querySelector('[x-dropdown]');
                    const typeMenu = root.querySelector('menu[popover]');
                    if (typeBtn && typeMenu) {
                        const typeUid = uid + '-type';
                        typeMenu.id = typeUid;
                        typeBtn.setAttribute('x-dropdown', typeUid);

                        const typeIcons = { linear: 'lucide:square-dashed', radial: 'lucide:circle-dashed', conic: 'lucide:triangle-dashed' };
                        const btnIcon = typeBtn.querySelector('[x-icon]');
                        if (btnIcon) btnIcon.setAttribute('x-icon', typeIcons[layer.type] || typeIcons.linear);

                        typeMenu.querySelectorAll('[data-type]').forEach(item => {
                            item.addEventListener('click', () => {
                                layer.type = item.dataset.type;
                                this.renderLayers(); this.syncToInput(); this.updateColorInput();
                            });
                        });

                        // Duplicate layer
                        const dupItem = typeMenu.querySelector('.layer-duplicate');
                        if (dupItem) dupItem.addEventListener('click', () => {
                            this.duplicateLayer(li);
                        });

                        // Remove layer
                        const removeItem = typeMenu.querySelector('.layer-remove');
                        if (removeItem) {
                            removeItem.style.display = this.layers.length > 1 ? '' : 'none';
                            const hr = removeItem.previousElementSibling;
                            if (hr && hr.tagName === 'HR') hr.style.display = this.layers.length > 1 ? '' : 'none';
                            removeItem.addEventListener('click', () => {
                                this.removeLayer(li);
                            });
                        }

                        if (window.Alpine && window.Alpine.initTree) {
                            requestAnimationFrame(() => {
                                window.Alpine.initTree(typeBtn);
                                window.Alpine.initTree(typeMenu);
                            });
                        }
                    }

                    // ---- Stop bar ----
                    const stopBar = root.querySelector('.gradient-layer');
                    if (stopBar) {
                        this._renderStopBar(stopBar, layer, li);
                        stopBar.addEventListener('click', (e) => {
                            if (e.target.classList.contains('stop-handle')) return;
                            const rect = stopBar.getBoundingClientRect();
                            this.addStopToLayer(li, Math.round(((e.clientX - rect.left) / rect.width) * 100));
                        });
                    }

                    // ---- Angle input (drag-to-scrub, click-to-edit, right-click menu) ----
                    const angleLabel = root.querySelector('.layer-angle');
                    const angleInput = angleLabel ? angleLabel.querySelector('input[type=number]') : null;
                    const angleMenu = root.querySelector('.layer-angle-menu');

                    if (angleLabel) {
                        angleLabel.style.display = (layer.type === 'linear' || layer.type === 'conic') ? '' : 'none';
                    }

                    if (angleInput) {
                        angleInput.value = layer.angle;
                        angleInput.addEventListener('input', () => {
                            layer.angle = parseFloat(angleInput.value) || 0;
                            if (stopBar) this._updateStopBarPreview(stopBar, layer);
                            this.syncToInput(); this.updateColorInput();
                        });

                        let scrubbing = false, scrubStartX = 0, scrubStartAngle = 0;
                        angleInput.addEventListener('pointerdown', (e) => {
                            if (document.activeElement === angleInput) return;
                            e.preventDefault();
                            scrubbing = true; scrubStartX = e.clientX; scrubStartAngle = layer.angle;
                            angleInput.setPointerCapture(e.pointerId);
                        });
                        angleInput.addEventListener('pointermove', (e) => {
                            if (!scrubbing) return;
                            let newAngle = scrubStartAngle + (e.clientX - scrubStartX);
                            layer.angle = Math.round(((newAngle % 360) + 360) % 360);
                            angleInput.value = layer.angle;
                            if (stopBar) this._updateStopBarPreview(stopBar, layer);
                            this.syncToInput(); this.updateColorInput();
                        });
                        angleInput.addEventListener('pointerup', (e) => {
                            if (scrubbing) {
                                scrubbing = false;
                                if (Math.abs(e.clientX - scrubStartX) < 3) { angleInput.focus(); angleInput.select(); }
                            }
                        });

                        if (angleMenu) {
                            // Strip popover attribute — we manage visibility ourselves
                            angleMenu.removeAttribute('popover');
                            angleMenu.classList.remove('show');

                            angleInput.addEventListener('contextmenu', (e) => {
                                e.preventDefault();
                                // Close any other open floating menus first
                                el.querySelectorAll('.layer-angle-menu.show, .stop-floating-menu.show').forEach(m => m.classList.remove('show'));
                                angleMenu.style.position = 'fixed';
                                angleMenu.style.left = e.clientX + 'px';
                                angleMenu.style.top = e.clientY + 'px';
                                angleMenu.classList.add('show');
                            });
                        }
                    }

                    const flipItem = root.querySelector('.layer-flip');
                    if (flipItem) flipItem.addEventListener('click', () => {
                        if (angleMenu) angleMenu.classList.remove('show');
                        this.flipLayer(li);
                    });
                    const rotateItem = root.querySelector('.layer-rotate');
                    if (rotateItem) rotateItem.addEventListener('click', () => {
                        if (angleMenu) angleMenu.classList.remove('show');
                        this.rotateLayer(li);
                        if (angleInput) angleInput.value = this.layers[li].angle;
                    });

                    this.layersContainer.appendChild(clone);
                });
            },

            _renderStopBar(barEl, layer, layerIndex) {
                const preview = layer.stops.slice().sort((a,b) => a.position - b.position)
                    .map(s => `${colorToRgba(s.color)} ${s.position}%`).join(', ');
                barEl.style.background = `linear-gradient(to right, ${preview})`;

                layer.stops.forEach((stop, si) => {
                    const handle = document.createElement('div');
                    handle.className = 'stop-handle';
                    handle.style.left = stop.position + '%';
                    handle.style.backgroundColor = colorToRgba(stop.color);
                    if (layerIndex === this.activeLayerIndex && si === this.activeStopIndex) handle.classList.add('active');

                    let dragging = false;
                    handle.addEventListener('pointerdown', (e) => {
                        e.stopPropagation();
                        this.selectStop(layerIndex, si);
                        barEl.querySelectorAll('.stop-handle').forEach((h, idx) => h.classList.toggle('active', idx === si));
                        dragging = true;
                        handle.setPointerCapture(e.pointerId);
                    });
                    handle.addEventListener('pointermove', (e) => {
                        if (!dragging) return;
                        const rect = barEl.getBoundingClientRect();
                        stop.position = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                        handle.style.left = stop.position + '%';
                        this._updateStopBarPreview(barEl, layer);
                        this.syncToInput(); this.updateColorInput();
                    });
                    handle.addEventListener('pointerup', () => { dragging = false; });
                    handle.addEventListener('contextmenu', (e) => {
                        e.preventDefault(); e.stopPropagation();
                        this._showStopContextMenu(e, layerIndex, si);
                    });
                    barEl.appendChild(handle);
                });
            },

            _updateStopBarPreview(barEl, layer) {
                const preview = layer.stops.slice().sort((a,b) => a.position - b.position)
                    .map(s => `${colorToRgba(s.color)} ${s.position}%`).join(', ');
                barEl.style.background = `linear-gradient(to right, ${preview})`;
            },

            // ---- Stop floating menu (plain div, no popover) ----

            _showStopContextMenu(e, layerIndex, stopIndex) {
                // Remove any existing
                el.querySelectorAll('.stop-floating-menu').forEach(m => m.remove());
                // Close any other open floating menus
                el.querySelectorAll('.layer-angle-menu.show').forEach(m => m.classList.remove('show'));

                const ctx = document.createElement('menu');
                ctx.className = 'stop-floating-menu show';
                ctx.style.position = 'fixed';
                ctx.style.left = e.clientX + 'px';
                ctx.style.top = e.clientY + 'px';
                ctx.style.margin = '0';

                const close = () => { ctx.remove(); };

                const dupLi = document.createElement('li');
                dupLi.textContent = 'Duplicate Stop';
                dupLi.addEventListener('click', () => { this.duplicateStop(layerIndex, stopIndex); close(); });
                ctx.appendChild(dupLi);

                const layer = this.layers[layerIndex];
                if (layer.stops.length > 2) {
                    const delLi = document.createElement('li');
                    delLi.textContent = 'Delete Stop';
                    delLi.className = 'negative';
                    delLi.addEventListener('click', () => { this.removeStopFromLayer(layerIndex, stopIndex); close(); });
                    ctx.appendChild(delLi);
                }

                // Library colors
                const swatchesEl = el.querySelector('.swatches');
                if (swatchesEl && swatchesEl.querySelectorAll('[data-color]').length) {
                    ctx.appendChild(document.createElement('hr'));
                    const label = document.createElement('small');
                    label.textContent = 'Apply Color';
                    ctx.appendChild(label);
                    swatchesEl.querySelectorAll('[data-color]').forEach(sw => {
                        const li = document.createElement('li');
                        const dot = document.createElement('span');
                        Object.assign(dot.style, { width:'0.75rem', height:'0.75rem', borderRadius:'50%', backgroundColor:sw.dataset.color, display:'inline-block', marginRight:'0.375rem', flexShrink:'0' });
                        li.appendChild(dot);
                        const txt = document.createElement('span');
                        txt.textContent = sw.dataset.color;
                        li.appendChild(txt);
                        li.addEventListener('click', () => {
                            const parsed = parseCssColor(sw.dataset.color);
                            if (parsed) {
                                const hsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
                                this.layers[layerIndex].stops[stopIndex].color = { h:hsv.h, s:hsv.s, v:hsv.v, a:parsed.a };
                                this.renderLayers();
                                if (layerIndex === this.activeLayerIndex && stopIndex === this.activeStopIndex) this.syncUI();
                                this.syncToInput();
                            }
                            close();
                        });
                        ctx.appendChild(li);
                    });
                }

                el.appendChild(ctx);
            },

            // ---- Mode sync ----

            syncMode() {
                const data = el._x_dataStack && el._x_dataStack[0];
                if (data && data.tab) this.pickerMode = data.tab;
                if (this.isGradient()) this.renderLayers();
                this.syncToInput(); this.updateColorInput();
                requestAnimationFrame(() => { if (this.canvas) this.drawCanvas(); this.updateCanvasMarker(); });
            }
        };

        return state;
    }

    // ---- Main directive ----
    // x-colorpicker goes on the picker container (menu, div, etc.)
    // It finds its own hidden input inside, and its trigger button via x-dropdown pointing to its ID.

    Alpine.directive('colorpicker', (el, { expression }, { effect, cleanup }) => {

        requestAnimationFrame(() => {
            // Find trigger button: any element with x-dropdown pointing to this element's ID
            const elId = el.id;
            const triggerBtn = elId ? document.querySelector(`[x-dropdown="${elId}"]`) : null;

            const state = createPickerState(el, triggerBtn);
            el._colorpickerState = state;

            // Initialize from hidden input value
            const initVal = state.hiddenInput ? state.hiddenInput.value : '#000000';
            state.setFromString(initVal || '#000000');
            if (triggerBtn) triggerBtn.style.setProperty('--swatch-color', state.toSwatchColor());

            // Sync UI when trigger button is clicked (no popover event listening)
            if (triggerBtn) {
                triggerBtn.addEventListener('click', () => {
                    requestAnimationFrame(() => state.syncUI());
                });
            }

            // Close floating menus on outside click
            document.addEventListener('click', (e) => {
                const insideFloating = e.target.closest('.stop-floating-menu, .layer-angle-menu');
                if (insideFloating) return;
                el.querySelectorAll('.stop-floating-menu').forEach(m => m.remove());
                el.querySelectorAll('.layer-angle-menu.show').forEach(m => m.classList.remove('show'));
            });

            // Canvas setup
            if (state.canvas) {
                const wrapper = document.createElement('div');
                wrapper.className = 'canvas-wrapper';
                state.canvas.parentNode.insertBefore(wrapper, state.canvas);
                wrapper.appendChild(state.canvas);
                const reticle = document.createElement('div');
                reticle.className = 'color-reticle';
                wrapper.appendChild(reticle);
                state.reticle = reticle;

                let dragging = false;
                function canvasPick(e) {
                    const rect = state.canvas.getBoundingClientRect();
                    state.s = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                    state.v = Math.max(0, Math.min(100, (1 - (e.clientY - rect.top) / rect.height) * 100));
                    state.syncToInput(); state.updateSliders(); state.updateColorInput(); state.updateCanvasMarker();
                    if (state.isGradient()) state.renderLayers();
                }
                wrapper.addEventListener('pointerdown', (e) => { dragging = true; wrapper.setPointerCapture(e.pointerId); canvasPick(e); });
                wrapper.addEventListener('pointermove', (e) => { if (dragging) canvasPick(e); });
                wrapper.addEventListener('pointerup', () => { dragging = false; });
            }

            // Hue slider
            if (state.hueSlider) {
                state.hueSlider.min = 0; state.hueSlider.max = 360; state.hueSlider.step = 1;
                state.hueSlider.value = state.h;
                state.hueSlider.addEventListener('input', () => {
                    state.h = parseFloat(state.hueSlider.value);
                    state.drawCanvas(); state.updateCanvasMarker(); state.syncToInput(); state.updateColorInput();
                    if (state.isGradient()) state.renderLayers();
                });
            }

            // Alpha slider
            if (state.alphaSlider) {
                state.alphaSlider.min = 0; state.alphaSlider.max = 100; state.alphaSlider.step = 1;
                state.alphaSlider.value = Math.round(state.a * 100);
                state.alphaSlider.addEventListener('input', () => {
                    state.a = parseFloat(state.alphaSlider.value) / 100;
                    state.syncToInput(); state.updateColorInput(); state.updateAlphaInput();
                    if (state.isGradient()) state.renderLayers();
                });
            }

            // Color value input
            if (state.colorInput) {
                state.colorInput.value = state.toFormattedString();
                state.colorInput.addEventListener('input', () => {
                    if (state.setFromString(state.colorInput.value)) {
                        state.drawCanvas(); state.updateCanvasMarker(); state.updateSliders(); state.updateAlphaInput(); state.syncToInput();
                        if (state.isGradient()) state.renderLayers();
                    }
                });
                state.colorInput.addEventListener('blur', () => { state.colorInput.value = state.toFormattedString(); });
            }

            // Alpha input
            if (state.alphaInput) {
                state.alphaInput.value = Math.round(state.a * 100);
                state.alphaInput.addEventListener('input', () => {
                    const v = parseFloat(state.alphaInput.value);
                    if (!isNaN(v)) {
                        state.a = Math.max(0, Math.min(1, v / 100));
                        state.updateSliders(); state.updateColorInput(); state.syncToInput();
                        if (state.isGradient()) state.renderLayers();
                    }
                });
            }

            // Format select
            const formatSelect = el.querySelector('.color-format');
            if (formatSelect) {
                formatSelect.value = state.mode;
                formatSelect.addEventListener('change', () => { state.mode = formatSelect.value; state.updateColorInput(); });
            }

            // Watch Alpine tab changes
            let lastTab = 'solid';
            const checkTab = () => {
                const data = el._x_dataStack && el._x_dataStack[0];
                const tab = data && data.tab;
                if (tab && tab !== lastTab) { lastTab = tab; state.syncMode(); }
            };
            el.addEventListener('click', () => { requestAnimationFrame(checkTab); });

            // Add gradient layer button
            const addLayerBtn = el.querySelector('.gradient-add-layer');
            if (addLayerBtn) addLayerBtn.addEventListener('click', () => state.addLayer());

            // Eyedropper
            if (state.eyedropperBtn) {
                if (window.EyeDropper) {
                    state.eyedropperBtn.addEventListener('click', async () => {
                        try {
                            const result = await new EyeDropper().open();
                            state.setFromString(result.sRGBHex);
                            state.syncToInput(); state.syncUI();
                            if (state.isGradient()) state.renderLayers();
                        } catch (e) {}
                    });
                } else state.eyedropperBtn.style.display = 'none';
            }

            // Swatch presets
            const swatchesDiv = el.querySelector('.swatches');
            if (swatchesDiv) {
                swatchesDiv.addEventListener('click', (e) => {
                    const swatch = e.target.closest('[data-color]');
                    if (!swatch) return;
                    state.setFromString(swatch.dataset.color);
                    state.syncToInput(); state.syncUI();
                    if (state.isGradient()) state.renderLayers();
                });
            }

            cleanup(() => { delete el._colorpickerState; });
        });
    });
}

// Track initialization
let colorpickerPluginInitialized = false;
function ensureColorpickerPluginInitialized() {
    if (colorpickerPluginInitialized) return;
    if (!window.Alpine || typeof window.Alpine.directive !== 'function') return;
    colorpickerPluginInitialized = true;
    initializeColorpickerPlugin();
    if (window.Alpine && typeof window.Alpine.initTree === 'function')
        document.querySelectorAll('[x-colorpicker]').forEach(el => { if (!el.__x) window.Alpine.initTree(el); });
}
window.ensureColorpickerPluginInitialized = ensureColorpickerPluginInitialized;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureColorpickerPluginInitialized);
document.addEventListener('alpine:init', ensureColorpickerPluginInitialized);
if (window.Alpine && typeof window.Alpine.directive === 'function') setTimeout(ensureColorpickerPluginInitialized, 0);
else if (document.readyState === 'complete') {
    const check = setInterval(() => { if (window.Alpine && typeof window.Alpine.directive === 'function') { clearInterval(check); ensureColorpickerPluginInitialized(); } }, 10);
    setTimeout(() => clearInterval(check), 5000);
}
