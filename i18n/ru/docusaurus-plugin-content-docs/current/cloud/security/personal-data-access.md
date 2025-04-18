---
sidebar_label: 'Доступ к персональным данным'
slug: /cloud/security/personal-data-access
title: 'Доступ к персональным данным'
description: 'Как зарегистрированный пользователь, ClickHouse позволяет вам просматривать и управлять данными вашего личного аккаунта, включая контактную информацию.'
---

import Image from '@theme/IdealImage';
import support_case_form from '@site/static/images/cloud/security/support-case-form.png';

## Введение {#intro}

Как зарегистрированный пользователь, ClickHouse позволяет вам просматривать и управлять данными вашего личного аккаунта, включая контактную информацию. В зависимости от вашей роли это также может включать доступ к контактной информации других пользователей вашей организации, деталям API ключей и другой актуальной информации. Вы можете управлять этими данными непосредственно через консоль ClickHouse на самообслуживании.

**Что такое Запрос на доступ к персональным данным (DSAR)**

В зависимости от вашего местоположения применимое законодательство может предоставить вам дополнительные права касательно персональных данных, которые ClickHouse хранит о вас (Права субъекта данных), как описано в Политике конфиденциальности ClickHouse. Процесс реализации прав субъекта данных известен как Запрос на доступ к персональным данным (DSAR).

**Объем персональных данных**

Пожалуйста, ознакомьтесь с Политикой конфиденциальности ClickHouse для получения информации о персональных данных, которые ClickHouse собирает и как они могут быть использованы.

## Самообслуживание {#self-service}

По умолчанию ClickHouse предоставляет пользователям возможность просматривать свои персональные данные непосредственно из консоли ClickHouse.

Ниже приведен обзор данных, которые ClickHouse собирает во время настройки аккаунта и использования сервиса, а также информация о том, где конкретные персональные данные могут быть просмотрены в консоли ClickHouse.

| Местоположение/URL | Описание | Персональные данные |
|--------------------|----------|---------------------|
| https://auth.clickhouse.cloud/u/signup/ | Регистрация аккаунта | email, password |
| https://console.clickhouse.cloud/profile | Общие сведения о профиле пользователя | name, email |
| https://console.clickhouse.cloud/organizations/OrgID/members | Список пользователей в организации | name, email |
| https://console.clickhouse.cloud/organizations/OrgID/keys | Список API ключей и кто их создал | email |
| https://console.clickhouse.cloud/organizations/OrgID/audit | Журнал действий, перечисляющий действия отдельных пользователей | email |
| https://console.clickhouse.cloud/organizations/OrgID/billing | Информация о выставлении счетов и счет-фактурах | billing address, email |
| https://console.clickhouse.cloud/support | Взаимодействия с поддержкой ClickHouse | name, email |

Примечание: URL с `OrgID` нужно обновить для отражения `OrgID` вашего конкретного аккаунта.

### Текущие клиенты {#current-customers}

Если у вас есть аккаунт у нас, и вариант самообслуживания не решил вашу проблему с персональными данными, вы можете подать Запрос на доступ к персональным данным в соответствии с Политикой конфиденциальности. Для этого войдите в свой аккаунт ClickHouse и откройте [поддержку](https://console.clickhouse.cloud/support). Это помогает нам подтвердить вашу личность и упростить процесс обработки вашего запроса.

Пожалуйста, убедитесь, что вы включили следующие детали в ваш запрос в поддержку:

| Поле | Текст, который нужно включить в ваш запрос |
|-------------|---------------------------------------------------|
| Тема        | Запрос на доступ к персональным данным (DSAR)     |
| Описание    | Подробное описание информации, которую вы хотели бы, чтобы ClickHouse нашел, собрал и/или предоставил. |

<Image img={support_case_form} size="sm" alt="Форма поддержки в ClickHouse Cloud" border />

### Лица без аккаунта {#individuals-without-an-account}

Если у вас нет аккаунта у нас, и вариант самообслуживания выше не решил вашу проблему с персональными данными, и вы хотите сделать Запрос на доступ к персональным данным согласно Политике конфиденциальности, вы можете отправить эти запросы по электронной почте на [privacy@clickhouse.com](mailto:privacy@clickhouse.com).

## Подтверждение личности {#identity-verification}

Если вы подадите Запрос на доступ к персональным данным по электронной почте, мы можем запросить у вас определенную информацию, чтобы помочь нам подтвердить вашу личность и обработать ваш запрос. Применимое законодательство может требовать или позволять нам отклонить ваш запрос. Если мы отклоняем ваш запрос, мы сообщим вам причину, с учетом юридических ограничений.

Для получения дополнительной информации, пожалуйста, ознакомьтесь с [Политикой конфиденциальности ClickHouse](https://clickhouse.com/legal/privacy-policy)
