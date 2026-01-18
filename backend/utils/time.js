function addTime(baseDate, { days = 0, hours = 0, minutes = 0 }) {
    return new Date(
        baseDate.getTime() +
        (days * 24 * 60 * 60 * 1000) +
        (hours * 60 * 60 * 1000) +
        (minutes * 60 * 1000)
    )
}

export default addTime