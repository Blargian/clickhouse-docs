---
sidebar_label: 'Приглашения'
title: 'Приглашения'
slug: /cloud/manage/api/invitations-api-reference
description: 'Документация по API облака для приглашений'
---

## Список всех приглашений

Возвращает список всех приглашений организации.

| Метод | Путь |
| :----- | :--- |
| GET | `/v1/organizations/{organizationId}/invitations` |

### Запрос

#### Параметры пути

| Имя | Тип | Описание |
| :--- | :--- | :---------- |
| organizationId | uuid | ID запрашиваемой организации. | 

### Ответ

#### Схема ответа

| Имя | Тип | Описание |
| :--- | :--- | :---------- |
| role | string | Роль участника в организации. | 
| id | uuid | Уникальный ID приглашения. | 
| email | email | Email приглашённого пользователя. Только пользователь с этим email может присоединиться, используя приглашение. Email хранится в нижнем регистре. | 
| createdAt | date-time | Метка времени создания приглашения. ISO-8601. | 
| expireAt | date-time | Метка времени, когда приглашение истечёт. ISO-8601. | 

#### Пример ответа

```
{
  "role": "string",
  "id": "uuid",
  "email": "email",
  "createdAt": "date-time",
  "expireAt": "date-time"
}
```

## Создать приглашение

Создаёт приглашение в организацию.

| Метод | Путь |
| :----- | :--- |
| POST | `/v1/organizations/{organizationId}/invitations` |

### Запрос

#### Параметры пути

| Имя | Тип | Описание |
| :--- | :--- | :---------- |
| organizationId | uuid | ID организации, в которую нужно пригласить пользователя. |

### Параметры тела

| Имя | Тип | Описание |
| :--- | :--- | :---------- |
| email | string | Email приглашённого пользователя. Только пользователь с этим email может присоединиться, используя приглашение. Email хранится в нижнем регистре. | 
| role | string | Роль участника в организации. | 

### Ответ

#### Схема ответа

| Имя | Тип | Описание |
| :--- | :--- | :---------- |
| role | string | Роль участника в организации. | 
| id | uuid | Уникальный ID приглашения. | 
| email | email | Email приглашённого пользователя. Только пользователь с этим email может присоединиться, используя приглашение. Email хранится в нижнем регистре. | 
| createdAt | date-time | Метка времени создания приглашения. ISO-8601. | 
| expireAt | date-time | Метка времени, когда приглашение истечёт. ISO-8601. | 

#### Пример ответа

```
{
  "role": "string",
  "id": "uuid",
  "email": "email",
  "createdAt": "date-time",
  "expireAt": "date-time"
}
```

## Получить детали приглашения

Возвращает детали для одного приглашения в организацию.

| Метод | Путь |
| :----- | :--- |
| GET | `/v1/organizations/{organizationId}/invitations/{invitationId}` |

### Запрос

#### Параметры пути

| Имя | Тип | Описание |
| :--- | :--- | :---------- |
| organizationId | uuid | ID запрашиваемой организации. | 
| invitationId | uuid | ID запрашиваемого приглашения. | 

### Ответ

#### Схема ответа

| Имя | Тип | Описание |
| :--- | :--- | :---------- |
| role | string | Роль участника в организации. | 
| id | uuid | Уникальный ID приглашения. | 
| email | email | Email приглашённого пользователя. Только пользователь с этим email может присоединиться, используя приглашение. Email хранится в нижнем регистре. | 
| createdAt | date-time | Метка времени создания приглашения. ISO-8601. | 
| expireAt | date-time | Метка времени, когда приглашение истечёт. ISO-8601. | 

#### Пример ответа

```
{
  "role": "string",
  "id": "uuid",
  "email": "email",
  "createdAt": "date-time",
  "expireAt": "date-time"
}
```

## Удалить приглашение организации

Удаляет одно приглашение в организацию.

| Метод | Путь |
| :----- | :--- |
| DELETE | `/v1/organizations/{organizationId}/invitations/{invitationId}` |

### Запрос

#### Параметры пути

| Имя | Тип | Описание |
| :--- | :--- | :---------- |
| organizationId | uuid | ID организации, которая имеет приглашение. | 
| invitationId | uuid | ID запрашиваемого приглашения. | 
