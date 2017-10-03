	define(['jquery', 'lib/components/base/modal'], function($, Modal){
		var CustomWidget = function () {
			var self = this;
			var url = 'https://lk.zvonobot.ru';
			var leadStatus = '';
			this.getCurrentPhoneList = function () {
				var area = self.system().area,
					list = [],
					phones,
					k = 0,
					l,k2,l2,c;

				if (area == 'ccard' || area == 'comcard' || area == 'lcard') {
					phones = $(' form .phone_wrapper input[type=text],form[action="/ajax/contacts/detail/"] div[data-pei-code=phone] input[type=text]'
						+ (area == 'ccard'
						? ''
						: ',form[action="/ajax/companies/detail/"] div[data-pei-code=phone] input[type=text]'));
					
					for (l = phones.length; k < l; k++) {
						if (!phones[k].value) {
							continue;
						}

						c = $(phones[k]).parents('form');
						var id_card = c.children('input[name=ID]').val();

						if (!id_card) 
							$('input[name=MAIN_ID]').each(function () {
								id_card = this.value
							});
						if (!id_card) 
							$('input[name="contact[ID]"]').each(function () {
								id_card = this.value
							});
						var name = '';
						c.find('[name="contact[NAME]"]').each(function () {
								name = this.value
							});
						var com = '';
						c.find('[name="company[NAME]"]').each(function () {
								com = this.value
							});

						if (area != 'lcard') {
							if (name == '') 
								$('[id="person_name"]').each(function () {
									name = this.value;
								});
							if (com == '') 
								$('[name="contact[NAME]"].linked-form__cf').each(function () {
									com = this.value;
								});

							}
						
						list.push([ phones[k].value,id_card,c.prop('action').indexOf('contacts') != -1 ? 1 : 0, name, com ]);

					}

				} else if (area == 'clist') {
					phones = self.list_selected().selected;
					var com  = '',
						name = '';
					for (l = phones.length; k < l; k++) {
						c = phones[k];
						for (k2 = 0, l2 = c['phones'].length; k2 < l2; k2++) {
							if (!c['phones'][k2]) {
								continue;
							}
							name = '';
							$('div.js-item-id-' + c['id'] + ' a.list-row__template-name__table-wrapper__name-link').each(function () {
								if (name == '') 
									name = this.innerHTML;
								}
							);
							com = '';
							$('div.js-item-id-' + c['id'] + ' div.content-table__item__inner>a.js-navigate-link').each(function () {
								if (com == '') 
									com = this.innerHTML;
								}
							);

							list.push([	c['phones'][k2],c['id'],c['type'] == 'contact'? 1 : 0,name,com ]);
						}
					}
				} else {
					return null;
				}

				return list;
			};
			
			this.modalWindowOpen = function() {
				var data ='<h1>Для добавления исходящих номеров необходимо:</h1><p>1. <a href="https://lk.zvonobot.ru" target="_blank">Зайти в личный кабинет</a></p><p>2. Ввести ваш email и пароль, указанный при добавлении виджета</p><p>3. На вкладке "Другое", в строке "Номера" нажать на подпункт "Создать исходящий номер"</p><p>4. Ввести ваш номер, подождать звонка, и подтвердить свой номер</p><br><p>Готово! Теперь вы можете использовать свой номер в качестве исходящего</p>';
				modal = new Modal({	
				  class_name: 'modal-window',
				   init: function ($modal_body) {
					   var $this = $(this);
					   $modal_body
						  .trigger('modal:loaded')
						  .html(data)
						  .trigger('modal:centrify')
						  .append('<span class="modal-body__close"><span class="icon icon-modal-close"></span></span>');
				    },
					destroy: function () {
					}
				});
			};

			this.modalConfigLeads = function() {		
				$.ajax({
				    url: '/private/api/v2/json/accounts/current',             // указываем URL и
				    dataType : "json",                     // тип загружаемых данных
				    success: function (data) { // вешаем свой обработчик на функцию success
				        var leads_statuses = data.response.account.leads_statuses;
				        console.log(leads_statuses);
				        var template = '<style> .f1-modal-header{ font-size: 16pt; font-weight: bold; padding-bottom: 10px;}'
						+ '#f1golos-leads-select {width: 84%; margin: 0 auto; height: 35px; background-color: #f3f1f1; color: #666666;}'
						+'.f1golos-leads-confrim {height: 35px; background-color: #6dc985; color: #fff; width: 40px;}'
						+'.f1-modal-p {padding-bottom: 10px;}'
						+'#f1golos-leads-select, .f1golos-leads-confrim {border-radius: 5px; }'
						+'</style>';
						template +='<h1 class="f1-modal-header">Настройка сценария звонка</h1>'
						+ "<p class='f1-modal-p'>Вы можете выбрать, по достижению какого статуса сделки отправлять звонок или же отправлять звонок при любой смене статуса сделки</p>"
						+'<select id="f1golos-leads-select">'
						leads_statuses.forEach(function(leads) {
							template += '<option>' + leads.name + '</option>'
						});
						template += '</select> <button class="f1golos-leads-confrim">OK</button>';
						
				        modal = new Modal({	
						  class_name: 'modal-window',
						   init: function ($modal_body) {
							   var $this = $(this);
							   $modal_body
								  .trigger('modal:loaded')
								  .html(template)
								  .trigger('modal:centrify')
								  .append('<span class="modal-body__close"><span class="icon icon-modal-close"></span></span>');
								leadStatus = document.all('f1golos-leads-select').value;
						    },
							destroy: function () {
							}
						});
				    } 
				});
				
			};
			
			this.createNotification = function(id_card, number) {
				var area = self.system().area;
				var id_card = 0;
				var number = -1;
				if (area == 'ccard' || area == 'comcard' || area == 'lcard') {
					var phonesHtml = $(' form .phone_wrapper input[type=text],form[action="/ajax/contacts/detail/"] div[data-pei-code=phone] input[type=text]'
						+ (area == 'ccard'
						? ''
						: ',form[action="/ajax/companies/detail/"] div[data-pei-code=phone] input[type=text]'));
					k = 0;
					for (l = phonesHtml.length; k < l; k++) {
						if (!phonesHtml[k].value) {
							continue;
						}

						c = $(phonesHtml[k]).parents('form');
						id_card = c.children('input[name=ID]').val();

						if (!id_card) 
							$('input[name=MAIN_ID]').each(function () {
								id_card = this.value
							});
						if (!id_card) 
							$('input[name="contact[ID]"]').each(function () {
								id_card = this.value
							});
					}
					number = c.prop('action').indexOf('contacts') != -1 ? 1 : 0;
					if (number != -1 && id_card != 0) {
						 $.ajax({
						  type: 'POST',
						  dataType: 'json',
						  url: '/private/api/v2/json/notes/set',
						  data: JSON.stringify({
						   "request": {
							"notes": {
							 "add": [{
								"element_id": id_card,
								"element_type": number,
								"note_type": 4,
								"request_id": 0,
								"text": 'Создание звонка через виджет ZVONOBOT',
								"responsible_user_id": window['AMOCRM']['constant']('user')['id'],
							 }]
							}
						   }
						  })
						 });
					}
				}
			};

			this.sendInfo = function () {
				var apiKey = document.all('api-label').innerHTML;
				var outgoingPhone = document.all('f1golos-phones-select').value;
				var textCall = document.all('record').value;
				var phonesStr = document.all('phones').value;
				var audioId = document.all('f1golos-audio-select').value;
				var phones = phonesStr.replace(' ','\n').split('\n');
				
				console.log(leadStatus);	
				if ($('.f1golos-record-radio-one').attr('checked') == 'checked') {
					if (textCall != '') {
						setTimeout(function () {	
							self.crm_post(url + '/apiCalls/createRecord',{
								apiKey: apiKey,
								name: 'audioAMO_' + (new Date()).toDateString(),
								source: 'text',
								text: textCall
							}, function (msgCall) {
								if (msgCall.status == 'success') {
								self.createNotification();
								setTimeout(function() {
									self.crm_post(url + '/apiCalls/create',{
											apiKey: apiKey,
											outgoingPhone: outgoingPhone,
											record: {id: msgCall.data.id},
											phones: phones,
											label: 'amoCRM'
										}, function (msg) {
											if (msg.status == 'success') {
												//Номера передались успешно в админку									 
											}
										},'json');
								}, 1000);
									document.all('status-label').innerHTML = "Рассылка успешно завершена";
									return true;
								} else {
									document.all('status-label').innerHTML = "Ваш Api-ключ недействителен: обратитесь в техподдержку на сайте lk.zvonobot.ru";
									return false;
								}
							}, 'json');
						}, 1000);
					} else {
						document.all('status-label').innerHTML = "Текст аудиоролика не должен быть пустой";
						$('.btn').removeAttr('disabled');
						return false;
					}
				} else {
					if (audioId != "" && audioId != 0) {
						self.createNotification();
						setTimeout(function() {
							self.crm_post(url + '/apiCalls/create',{
									apiKey: apiKey,
									outgoingPhone: outgoingPhone,
									record: {id: audioId},
									phones: phones,
									label: 'amoCRM'
								}, function (msg) {
									if (msg.status == 'success') {
										//Номера передались успешно в админку
									}
								},'json');
						}, 1000);
					} else {
						document.all('status-label').innerHTML = "У вас нет доступных аудиороликов";
						$('.btn').removeAttr('disabled');
						return false;
					}
				}
			};
			
			this.fillSelect = function (outgoingPhones) {
				if (document.all('f1golos-phones-select') != null) {
					for(var i = 0; i < outgoingPhones.length; i++) {
						var opt = document.createElement('option');
						opt.innerHTML = outgoingPhones[i];
						opt.value = outgoingPhones[i];
						document.all('f1golos-phones-select').appendChild(opt);
					}
				}
			}
			
			this.normalizePhone = function (phone) {
				return phone;
			}
			
			this.enableBtn  = function () {
				$('.btn.f1golos-start').removeAttr('disabled');
				document.all('status-label').innerHTML = "Рассылка успешно завершена";
			}
			
			this.showText = function() {
				$('.textAudio').attr('hidden',false);
				$('.audio').attr('hidden',true);
				$('.f1golos-record-radio-one').attr('checked','checked');
				$('.f1golos-record-radio-two').attr('checked',false);
			}
			
			this.getRecords = function() {
				var opt = document.createElement('option');
				opt.innerHTML = 'Загрузка...';
				opt.label = 'Загрузка...';
				opt.value = 0;
				document.all('f1golos-audio-select').appendChild(opt);
				setTimeout(function() {
					self.crm_post(url + '/apiCalls/getRecords', {
						apiKey : apiKey,
						forAmoGet: 1
					}, function message (msg) {
						if (msg.status == 'success') {
							document.all('f1golos-audio-select').options[0] = null;
							if (msg.data.length > 0) {
								for (var i = 0; i < msg.data.length; i++) {
									var opt = document.createElement('option');
									opt.innerHTML = msg.data[i].name;
									opt.label = msg.data[i].name;
									opt.value = msg.data[i].id;
									document.all('f1golos-audio-select').appendChild(opt);
								}
							} else {
								var opt = document.createElement('option');
								document.all('f1golos-audio-select').innerHTML = "У вас нет аудиороликов";
								document.all('f1golos-audio-select').label = "У вас нет аудиороликов";
								document.all('f1golos-audio-select').value = 0;
								document.all('f1golos-audio-select').appendChild(opt);
							}
						}
					}, 'json'); 
				}, 3000);
			}
			
			this.showSelect = function() {
				$('.audio').attr('hidden',false);
				$('.textAudio').attr('hidden',true);
				$('.f1golos-record-radio-one').attr('checked',false);
				$('.f1golos-record-radio-two').attr('checked','checked');
				var apiKey = document.all('api-label').innerHTML;
				if ($('#f1golos-audio-select option').length == 0) {
					if (apiKey == '') {
						setTimeout(self.getRecords(), 1500);
					} else {
						self.getRecords();
					}
				}				
			}
			
			this.createWidget = function (phones) {	
				var area = self.system().area;	
				var template = '<style> .f1golos-phones{position:relative;display: inline-block !important;width:80% !important}  .f1golos-plus{position:relative;display: inline-block !important;width:20% !important}.f1golos-mainstyle { padding: 10px; font-family: "Roboto","Helvetica Neue", Helvetica, Arial, sans-serif; color: #666666 ; font-size: 16px; line-height: 1.846; } .f1golos-mainstyle .form-control { display: block; width: 100%; background-color: rgba(33, 150, 243, 0.1) !important; font: inherit; color: #666666 ; border: none; outline: 0; } .f1golos-mainstyle select.form-control { height: 35px; } .f1golos-mainstyle textarea { resize: vertical; } .f1golos-mainstyle textarea:focus { -webkit-box-shadow: inset 0 -2px 0 #6dc985 ; box-shadow: inset 0 -2px 0 #6dc985 ; } .f1golos-mainstyle .form-control.has-error { -webkit-box-shadow: inset 0 -2px 0 #e51c23 ; box-shadow: inset 0 -2px 0 #e51c23 ; } .f1golos-mainstyle .text-danger { font-size: 12px; color: #e51c23 } .f1golos-mainstyle button { margin: 5px 0; border: none; -webkit-box-shadow: 1px 1px 4px rgba(0,0,0,0.4); box-shadow: 1px 1px 4px rgba(0,0,0,0.4); -webkit-transition: all 0.4s; -o-transition: all 0.4s; transition: all 0.4s; color: #ffffff ; cursor: pointer; padding: 6px 16px; font: inherit; font-size: 14px; border-radius: 3px; background-color: #6dc985 ; } .f1golos-mainstyle button:hover, .f1golos-mainstyle button:focus{ background-color: #6dc985 ; }.f1golos-mainstyle button:disabled{ background-color: #444444 ; }</style>';
				template += '<div class="f1golos-mainstyle">'
				if (area == 'lcard') {
					template += '<button class="btn f1golos-config-leads">Настройка сценария звонка</button>'
				}
				template += '<div> <span>На какие номера будем звонить?</span> <textarea class="form-control" rows="3" name="phones" id="phones" readonly>' + phones + '</textarea> </div> <div> <span>С какого номера будем звонить?</span> <select id="f1golos-phones-select" class="form-control f1golos-phones"> </select><button class="btn f1golos-plus">+</button> </div> <div class="radio"> <input id="f1golos-record-radio-one" class="f1golos-record-radio-one" type="radio" name="record-radio" value="f1golos-record-radio-one" checked="checked"> <label for="f1golos-record-radio-one">Текст</label> <input id="f1golos-record-radio-two" class="f1golos-record-radio-two" type="radio" name="record-radio" value="f1golos-record-radio-two"> <label for="f1golos-record-radio-two">Аудиоролики</label> </div> <div class="textAudio"> <span>Создайте аудиоролик для рассылки</span> <textarea class="form-control" name="record" id="record" placeholder="Введите текст аудиоролика" required></textarea></div> <div class="audio"> <span>Выберите аудиоролик</span> <select id="f1golos-audio-select" class="form-control"> </select> </div> <div style="text-align: center; padding-top: 15px"> <span class="status-label" id="status-label" name="status-label" style="color:#6dc985 "></span> <button class="btn f1golos-start">Начать рассылку</button> </div> <div class="systemInfo"><span class="api-label" id="api-label"></span></div></div>';

				self.render_template({
					caption:{
						class_name:'js-ac-class',
						html: ''
					},
					body: '',
					render : template					
				});
				$('.audio').attr('hidden',true);
				$('.systemInfo').attr('hidden',true);
				$('.btn.f1golos-start').on('click', function(){
							$('.btn.f1golos-start').attr('disabled','disabled');
							document.all('status-label').innerHTML = 'Рассылка в процессе. Вся статистика по ней находиться в личном кабинете, по адресу <a href="https://lk.zvonobot.ru" target="_blank">lk.zvonobot.ru</a>';
							self.sendInfo(); 
							setTimeout(self.enableBtn, 10000);
						});
						$('.btn.f1golos-plus').on('click', function(){
							self.modalWindowOpen();
						});

						$('.btn.f1golos-config-leads').on('click', function(){
							self.modalConfigLeads();
						});
						
						$('.f1golos-record-radio-one').on('click', function(){
							self.showText();
						});
						$('.f1golos-record-radio-two').on('click', function(){
							self.showSelect();
						});
						
						$('div#card_widgets_overlay.default-overlay.default-overlay-visible').on('click', function(){
							self.widgetsOverlay(false);
						});
			};
			
			this.getOutgoingPhones = function() {
					self.crm_post(url + '/api/users/authAmo', { 
								email : self.get_settings()['email'],
								password : self.get_settings()['password']
							}, function (msg) {
								if (msg.status == 'success') {
									id = msg.data.id;
									document.all('api-label').innerHTML = msg.data.apiKey;
									apiKey = msg.data.apiKey;
									self.crm_post(url + '/apiCalls/getPhones', {
										apiKey : apiKey,
										status : 'available'
									}, function message (msg) {
										if (msg.status == 'success') {
											var outPhones = [];
											for (var i = 0; i < msg.data.length; i++) {
												outPhones.push(msg.data[i].phone);
											}
											self.fillSelect(outPhones);
										} else {
											self.fillSelect(['Все линии заняты, попробуйте позже']);
										}
									}, 'json');
								} else {
									self.fillSelect(['Вы ввели неверный пароль при установке виджета. Вернитесь в меню настройки виджета, и введите корректный пароль, либо свяжитесь с нами по телефону +79223166579']);
								}
							}, 'json');
			}
			
			this.callbacks = {
				render: function(){
					var area = self.system().area;
					var strPhones = '';
					if (area == 'ccard' || area == 'comcard' || area == 'lcard') {
						var phones = self.getCurrentPhoneList();
						for (var i = 0; i<phones.length; i++) {
							if (i != 0) {
								 strPhones += '\n';
							}
							
							strPhones += self.normalizePhone(phones[i][0]);
						}
						self.createWidget(strPhones);
						}					
					return true;
				},
				init: function(){
					return true;
				},
				bind_actions: function(){
					var area = self.system().area;
					if (area == 'ccard' || area == 'comcard' || area == 'lcard') {
						setTimeout(self.getOutgoingPhones(),2500);
					}
					return true;
				},
				settings: function(){
					$('.widget_settings_block__controls__[name=state]').each(function () {
						this.parentElement.parentElement.style.display = 'none';
					});
					$('input[name="vendosoft_confirmation"]').attr('type', 'checkbox');
					$('input[name="vendosoft_confirmation"]').attr('id', 'randomident9969');
					$('input[name="vendosoft_confirmation"]').css('cssText', 'width: 13px !important; height: 13px !important');
					$('input[name="vendosoft_confirmation"]').parent().append('<label for="randomident9969" style="padding-left: 5px">Согласен на передачу данных из аккаунта amoCRM в сервис lk.zvonobot.ru</label>');
					if ($('input[name="vendosoft_confirmation"]').val() == '1') {
						$('input[name="vendosoft_confirmation"]').prop('checked', true);
					}
					$('input[name="vendosoft_confirmation"]').parent().parent().css('display', 'block');
					$('input[name="vendosoft_confirmation"]').click(function () {
						if ($('input[name="vendosoft_confirmation"]').is(':checked')) {
							$('input[name="vendosoft_confirmation"]').val('1');
						} else {
							$('input[name="vendosoft_confirmation"]').val('');
						}
					});
					 $('.widget_settings_block__controls__[name=password]').each(function () {
						 if (this.value == "") {
							 var key = Math.floor(Math.random() * 100000000000);
							 this.value = key;
						 }
					 });
					
					if (window['AMOCRM'] && window['AMOCRM']['constant'] && window['AMOCRM']['constant']('user') && window['AMOCRM']['constant']('user')['login'] && window['AMOCRM']['constant']('user')['login'] != "") 
						$('.widget_settings_block__controls__[name=email]').each(function () {
							if (this.value == "") {
								this.value = window['AMOCRM']['constant']('user')['login'];
							}
						}
					);
					return true;
				},
				onSave: function(){
					var login = '',
						key   = '',
						phone = '';
						function golos_sMes(s){
							if(document.all('golos_setting_onDiv')){
								document.all('golos_setting_onDiv').innerHTML = s;
							} else {
								var k = document.createElement('div');
								k.id = 'golos_setting_onDiv';
								k.innerHTML = s;
								k.style.padding = '0px 0px 5px 0px';
								$('.widget_settings_block__controls').each(function(){
									this.insertBefore(k,this.children[0]);
								});
							}
						}
						var id = 0;
						$('.widget_settings_block__controls__[name=email]').each(function () {
							login = this.value;
						});
						$('.widget_settings_block__controls__[name=password]').each(function () {
							key = this.value;
						});
						$('.widget_settings_block__controls__[name=sender]').each(function () {
							phone = this.value;
							self.set_settings({phone:phone});
						});
						
						if (phone.indexOf('_') != -1) {
							golos_sMes('Проверьте корректность номера телефона');
							return false;
						}
						
						self.crm_post(url + '/api/users/registration', {
							email       : login,
							password    : key,
							phone       : phone,
							utmSource   : "amoCRM"
						}, function (msg) {
							if (msg.status == 'success') {
								id = msg.data.id;
								golos_sMes('Регистрация прошла успешно!');
								return true;
							} else {
								setTimeout(function() {
									self.crm_post(url + '/api/users/authAmo', { 
										email : login,
										password : key
									}, function (msg) {
										if (msg.status == 'success') {
											golos_sMes('Авторизация прошла успешно!');
											return true;
										} else {
											golos_sMes('Ошибка: этот email уже используется.');
											return false;
										}
									},'json');
								}, 1000);
							}
						}, 'json');
						return true;
				},
				destroy: function(){
					
				},
				contacts: {
						selected: function(){
							$('div.card-widgets__elements').children().remove();
							var strPhones = '';
							var phones = self.getCurrentPhoneList();
							for (var i = 0; i<phones.length; i++) {
								if (i != 0) {
									 strPhones += '\n';
								}
								strPhones += self.normalizePhone(phones[i][0]);
							}
							self.createWidget(strPhones);
							self.getOutgoingPhones();
						}
					},
				leads: {
						selected: function(){					
						}
					},
				tasks: {
						selected: function(){					
						}
					}
			};
			return this;
		};

	return CustomWidget;
	});