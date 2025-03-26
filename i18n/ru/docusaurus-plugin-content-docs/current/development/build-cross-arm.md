---
description: 'Руководство по сборке ClickHouse из исходников для архитектуры AARCH64'
sidebar_label: 'Сборка на Linux для AARCH64'
sidebar_position: 25
slug: /development/build-cross-arm
title: 'Как собрать ClickHouse на Linux для AARCH64'
---


# Как собрать ClickHouse на Linux для AARCH64

Не требуется никаких специальных шагов для сборки ClickHouse для Aarch64 на машине Aarch64.

Чтобы выполнить кросс-компиляцию ClickHouse для AArch64 на машине с x86 Linux, передайте следующую опцию в `cmake`: `-DCMAKE_TOOLCHAIN_FILE=cmake/linux/toolchain-aarch64.cmake`
